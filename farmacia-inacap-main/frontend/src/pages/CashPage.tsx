import { Plus, RefreshCcw, WalletCards } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  CashSessionPanel,
  type CashRegisterItem,
  type CashSessionItem,
} from "../components/cash/CashSessionPanel";
import { ActionModal, type ActionField } from "../components/ui/ActionModal";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { api } from "../lib/api";
import { nullable, numeric, runApiAction } from "../lib/actionHelpers";

const signedMovementAmount = (type: string, amount: number) => {
  switch (type) {
    case "OPENING":
    case "SALE":
    case "INCOME":
      return amount;
    case "EXPENSE":
    case "REFUND":
    case "WITHDRAWAL":
      return -amount;
    case "ADJUSTMENT":
    default:
      return amount;
  }
};

const getSessionExpectedAmount = (session: CashSessionItem): number => {
  if (session.expectedAmount !== null && session.expectedAmount !== undefined) {
    return Number(session.expectedAmount);
  }

  if (Array.isArray(session.movements) && session.movements.length > 0) {
    return Math.round(
      session.movements.reduce(
        (sum, movement) =>
          sum +
          signedMovementAmount(movement.type, Number(movement.amount ?? 0)),
        0,
      ),
    );
  }

  return Number(session.openingAmount ?? 0);
};

const closeSessionFields: ActionField[] = [
  {
    name: "countedAmount",
    label: "Monto contado",
    type: "number",
    min: 0,
    required: true,
    example: "125000",
    placeholder: "Ej.: 125000 (total en efectivo contado)",
    hint: "Total de dinero en efectivo contado físicamente en la gaveta al cerrar turno.",
  },
  {
    name: "notes",
    label: "Notas",
    type: "textarea",
    maxLength: 255,
    example: "Cuadre conforme sin diferencias. Retiro a caja fuerte realizado.",
    placeholder: "Ej.: Cuadre conforme sin diferencias (máx. 255 car.)",
    hint: "Observaciones del cierre de caja o justificación de diferencias.",
  },
];

const movementSessionFields: ActionField[] = [
  {
    name: "type",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      { value: "INCOME", label: "Ingreso" },
      { value: "EXPENSE", label: "Egreso" },
      { value: "WITHDRAWAL", label: "Retiro" },
      { value: "ADJUSTMENT", label: "Ajuste" },
    ],
  },
  {
    name: "amount",
    label: "Monto",
    type: "number",
    step: 1,
    required: true,
    hint: "Para ajustes puedes ingresar montos positivos o negativos.",
  },
  { name: "description", label: "Descripción", required: true },
];

const registerFields: ActionField[] = [
  {
    name: "code",
    label: "Código",
    required: true,
    minLength: 2,
    maxLength: 20,
    example: "CJ01",
    placeholder: "Ej.: CJ01 o CAJA-01 (de 2 a 20 car.)",
    hint: "Identificador corto de la caja, sin espacios ni caracteres especiales.",
    help: "Clave única para identificar el punto de cobro en reportes (ej: CJ01, PRINCIPAL).",
  },
  {
    name: "name",
    label: "Nombre",
    required: true,
    minLength: 2,
    maxLength: 60,
    example: "Caja Principal",
    placeholder: "Ej.: Caja Principal o Caja Mostrador (de 2 a 60 car.)",
    hint: "Nombre visible para el cajero y ventas en el local.",
    help: "Nombre con el que el equipo reconoce este punto de cobro.",
  },
  {
    name: "description",
    label: "Descripción",
    type: "textarea",
    maxLength: 255,
    example: "Caja ubicada en el mesón de atención principal",
    placeholder: "Ej.: Ubicada en mesón central para cobros en efectivo y tarjeta (máx. 255 car.)",
    hint: "Ubicación o notas internas sobre el uso de la caja.",
  },
];

export const CashPage = () => {
  const { hasPermission } = useAuth();
  const canOpenCash = hasPermission("cash.open");
  const canCloseCash = hasPermission("cash.close");
  const canAdjustCash = hasPermission("cash.adjust");

  const [modal, setModal] = useState<
    "open" | "close" | "movement" | "register" | null
  >(null);
  const [selected, setSelected] = useState<CashSessionItem | null>(null);
  const [editingRegister, setEditingRegister] =
    useState<CashRegisterItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const sessionSel = useCallback(
    (p: { sessions: CashSessionItem[] }) => p.sessions,
    [],
  );
  const regSel = useCallback(
    (p: { registers: CashRegisterItem[] }) => p.registers,
    [],
  );
  const sessionsRes = useResource<
    CashSessionItem[],
    { sessions: CashSessionItem[] }
  >("/cash/sessions?limit=100", sessionSel);
  const registersRes = useResource<
    CashRegisterItem[],
    { registers: CashRegisterItem[] }
  >("/cash/registers", regSel);
  const sessions = useMemo(() => sessionsRes.data ?? [], [sessionsRes.data]);
  const registers = useMemo(
    () => registersRes.data ?? [],
    [registersRes.data],
  );
  const openSessions = useMemo(
    () => sessions.filter((s) => s.status === "OPEN"),
    [sessions],
  );
  const summary = useMemo(
    () => ({
      open: openSessions.length,
      opening: openSessions.reduce(
        (a, s) => a + Number(s.openingAmount ?? 0),
        0,
      ),
      sales: openSessions.reduce((a, s) => a + (s._count?.sales ?? 0), 0),
      expected: openSessions.reduce(
        (a, s) => a + getSessionExpectedAmount(s),
        0,
      ),
    }),
    [openSessions],
  );

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setEditingRegister(null);
    setActionError("");
  };

  const reload = async () => {
    await Promise.all([sessionsRes.reload(), registersRes.reload()]);
  };

  const saveRegisterStatus = async (
    register: CashRegisterItem,
    isActive: boolean,
  ) => {
    if (
      !isActive &&
      sessions.some(
        (session) =>
          session.cashRegister.id === register.id && session.status === "OPEN",
      )
    ) {
      setActionError(
        "No se puede desactivar una caja con una sesión abierta. Cierra la sesión primero.",
      );
      return;
    }

    if (
      !isActive &&
      !confirm(
        `¿Desactivar la caja "${register.name}"? Se conservará su historial.`,
      )
    ) {
      return;
    }

    await runApiAction(
      () => api.patch(`/cash/registers/${register.id}`, { isActive }),
      setBusy,
      setActionError,
      reload,
    );
  };

  const submit = async (v: Record<string, string | number | boolean>) => {
    if (modal === "open") {
      await runApiAction(
        () =>
          api.post("/cash/sessions/open", {
            cashRegisterId: String(v.cashRegisterId),
            openingAmount: numeric(v.openingAmount),
            notes: nullable(v.notes),
          }),
        setBusy,
        setActionError,
        async () => {
          await reload();
          closeModal();
        },
      );
    }
    if (modal === "close" && selected) {
      await runApiAction(
        () =>
          api.post(`/cash/sessions/${selected.id}/close`, {
            countedAmount: numeric(v.countedAmount),
            notes: nullable(v.notes),
          }),
        setBusy,
        setActionError,
        async () => {
          await reload();
          closeModal();
        },
      );
    }
    if (modal === "movement" && selected) {
      const amount = numeric(v.amount);
      const movementType = String(v.type);
      if (amount === 0 || (movementType !== "ADJUSTMENT" && amount < 0)) {
        setActionError(
          movementType === "ADJUSTMENT"
            ? "El monto del ajuste no puede ser 0."
            : "El monto debe ser mayor a 0 para este tipo de movimiento.",
        );
        return;
      }

      await runApiAction(
        () =>
          api.post(`/cash/sessions/${selected.id}/movements`, {
            type: movementType,
            amount,
            description: String(v.description),
          }),
        setBusy,
        setActionError,
        async () => {
          await reload();
          closeModal();
        },
      );
    }
    if (modal === "register") {
      const payload = {
        code: String(v.code),
        name: String(v.name),
        description: nullable(v.description),
      };
      await runApiAction(
        () =>
          editingRegister
            ? api.patch(`/cash/registers/${editingRegister.id}`, payload)
            : api.post("/cash/registers", { ...payload, isActive: true }),
        setBusy,
        setActionError,
        async () => {
          await reload();
          closeModal();
        },
      );
    }
  };

  const fields = useMemo<ActionField[]>(() => {
    if (modal === "open") {
      return [
        {
          name: "cashRegisterId",
          label: "Caja",
          type: "select",
          required: true,
          hint: "Selecciona cuál de las cajas habilitadas vas a abrir.",
          emptyOptionsHint: "Todavía no hay cajas registradas. Primero crea una en «Nueva caja».",
          options: registers
            .filter((r) => r.isActive)
            .map((r) => ({ value: r.id, label: r.name })),
        },
        {
          name: "openingAmount",
          label: "Monto inicial",
          type: "number",
          min: 0,
          required: true,
          example: "50000",
          placeholder: "0 (dinero en efectivo para dar vuelto)",
          hint: "Dinero en efectivo base para dar vuelto. Si la caja empieza vacía, ingresa 0.",
        },
        {
          name: "notes",
          label: "Notas",
          type: "textarea",
          maxLength: 255,
          example: "Turno mañana - Apertura con sencillo para vuelto",
          placeholder: "Ej.: Turno mañana - Apertura con sencillo para vuelto (máx. 255 car.)",
          hint: "Notas del turno o persona responsable que recibe.",
        },
      ];
    }
    if (modal === "close") return closeSessionFields;
    if (modal === "movement") return movementSessionFields;
    if (modal === "register") return registerFields;
    return [];
  }, [modal, registers]);

  const initialValues = useMemo<Record<string, unknown>>(() => {
    if (modal === "open") return { openingAmount: 0 };
    if (modal === "movement") return { type: "INCOME" };
    if (editingRegister) return editingRegister;
    return {};
  }, [modal, editingRegister]);

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Tesorería"
        title="Caja"
        description="Sesiones, aperturas, cierres y movimientos."
        actions={
          <div className="module-toolbar-actions">
            <button
              className="button button--secondary"
              onClick={() => void reload()}
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>
            {canAdjustCash ? (
              <button
                className="button button--secondary"
                onClick={() => {
                  setEditingRegister(null);
                  setModal("register");
                }}
              >
                <Plus size={17} />
                Nueva caja
              </button>
            ) : null}
            {canOpenCash ? (
              <button
                className="button button--primary"
                onClick={() => setModal("open")}
              >
                <WalletCards size={17} />
                Abrir caja
              </button>
            ) : null}
          </div>
        }
      />
      {sessionsRes.loading || registersRes.loading ? <PageLoader /> : null}
      {sessionsRes.error || registersRes.error || actionError ? (
        <div className="alert alert--error">
          {sessionsRes.error || registersRes.error || actionError}
        </div>
      ) : null}
      {!sessionsRes.loading && !registersRes.loading ? (
        <CashSessionPanel
          summary={summary}
          registers={registers}
          sessions={sessions}
          canAdjustCash={canAdjustCash}
          canCloseCash={canCloseCash}
          onEditRegister={(register) => {
            setEditingRegister(register);
            setModal("register");
          }}
          onToggleRegisterStatus={(register, isActive) =>
            void saveRegisterStatus(register, isActive)
          }
          onOpenMovementModal={(session) => {
            setSelected(session);
            setModal("movement");
          }}
          onOpenCloseModal={(session) => {
            setSelected(session);
            setModal("close");
          }}
        />
      ) : null}
      <ActionModal
        open={Boolean(modal)}
        title={
          modal === "open"
            ? "Abrir caja"
            : modal === "close"
              ? "Cerrar caja"
              : modal === "movement"
                ? "Registrar movimiento"
                : editingRegister
                  ? "Editar caja"
                  : "Nueva caja"
        }
        fields={fields}
        initialValues={initialValues}
        busy={busy}
        error={actionError}
        onClose={closeModal}
        onSubmit={submit}
      />
    </div>
  );
};
