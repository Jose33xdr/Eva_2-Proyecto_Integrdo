import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  ControlledSubstanceLedger,
  type ControlledBatch,
  type ControlledPatient,
  type ControlledProduct,
  type ControlledRecordRow,
} from "../components/clinical/ControlledSubstanceLedger";
import { ActionModal, type ActionField } from "../components/ui/ActionModal";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { api } from "../lib/api";
import { nullable, numeric, runApiAction } from "../lib/actionHelpers";
import { translateChoiceLabel } from "../lib/choiceLabels";

type Doctor = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
};
type FormValues = Record<string, string | number | boolean>;

const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const defaultControlledInitialValues = {
  movementType: "ADJUSTMENT_IN",
  quantity: 1,
};

export const ControlledPage = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("controlled.manage");

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [todayIso] = useState(() => new Date().toISOString());

  const recSel = useCallback(
    (p: { items: ControlledRecordRow[] }) => p.items,
    [],
  );
  const prodSel = useCallback(
    (p: { items: ControlledProduct[] }) => p.items,
    [],
  );
  const batchSel = useCallback(
    (p: { items: ControlledBatch[] }) => p.items,
    [],
  );
  const patientSel = useCallback(
    (p: { items: ControlledPatient[] }) => p.items,
    [],
  );
  const doctorSel = useCallback((p: { items: Doctor[] }) => p.items, []);

  const recRes = useResource<
    ControlledRecordRow[],
    { items: ControlledRecordRow[] }
  >("/controlled-drugs?limit=100", recSel);
  const prodRes = useResource<
    ControlledProduct[],
    { items: ControlledProduct[] }
  >("/products?limit=100&isControlled=true", prodSel);
  const batchRes = useResource<ControlledBatch[], { items: ControlledBatch[] }>(
    "/inventory/batches?limit=100",
    batchSel,
  );
  const patientRes = useResource<
    ControlledPatient[],
    { items: ControlledPatient[] }
  >("/patients?limit=100", patientSel);
  const doctorRes = useResource<Doctor[], { items: Doctor[] }>(
    "/doctors?limit=100",
    doctorSel,
  );

  const rows = useMemo(() => recRes.data ?? [], [recRes.data]);
  const products = useMemo(
    () =>
      (prodRes.data ?? []).filter(
        (p) => p.isControlled && p.isActive !== false,
      ),
    [prodRes.data],
  );
  const batches = useMemo(
    () =>
      (batchRes.data ?? []).filter(
        (b) =>
          !b.isBlocked &&
          (!b.expirationDate ||
            new Date(b.expirationDate).toISOString() > todayIso) &&
          (b.product?.isActive ?? true),
      ),
    [batchRes.data, todayIso],
  );
  const patients = useMemo(
    () => (patientRes.data ?? []).filter((p) => p.isActive !== false),
    [patientRes.data],
  );
  const doctors = useMemo(
    () => (doctorRes.data ?? []).filter((d) => d.isActive !== false),
    [doctorRes.data],
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !q ||
          norm(
            [
              r.recordNumber,
              r.product?.name ?? "",
              r.product?.sku ?? "",
              r.batch?.batchNumber ?? "",
              r.patient?.rut ?? "",
            ].join(" "),
          ).includes(norm(q)),
      ),
    [rows, q],
  );

  const fields = useMemo<ActionField[]>(
    () => [
      { name: "recordNumber", label: "N° registro", required: true },
      {
        name: "movementType",
        label: "Movimiento",
        type: "select",
        required: true,
        options: [
          "PURCHASE_RECEIPT",
          "RETURN",
          "ADJUSTMENT_IN",
          "ADJUSTMENT_OUT",
          "DESTRUCTION",
        ].map((v) => ({ value: v, label: translateChoiceLabel(v) })),
      },
      {
        name: "productId",
        label: "Producto controlado",
        type: "select",
        required: true,
        options: products.map((p) => ({
          value: p.id,
          label: `${p.sku} · ${p.name}`,
        })),
      },
      {
        name: "batchId",
        label: "Lote",
        type: "select",
        options: batches.map((b) => ({
          value: b.id,
          label: `${b.batchNumber} · ${b.product?.name ?? ""}`,
        })),
      },
      {
        name: "patientId",
        label: "Paciente",
        type: "select",
        options: patients.map((p) => ({
          value: p.id,
          label: `${p.rut} · ${p.firstName} ${p.lastName}`,
        })),
      },
      {
        name: "doctorId",
        label: "Médico",
        type: "select",
        options: doctors.map((d) => ({
          value: d.id,
          label: `${d.firstName} ${d.lastName}`,
        })),
      },
      {
        name: "quantity",
        label: "Cantidad",
        type: "number",
        min: 1,
        required: true,
      },
      { name: "balanceBefore", label: "Saldo antes", type: "number" },
      { name: "balanceAfter", label: "Saldo después", type: "number" },
      { name: "prescriptionFolio", label: "Folio receta" },
      { name: "ispReference", label: "Referencia ISP" },
      { name: "reason", label: "Motivo", type: "textarea" },
    ],
    [products, batches, patients, doctors],
  );

  const close = () => {
    setOpen(false);
    setActionError("");
  };

  const save = async (v: FormValues) => {
    const payload: Record<string, unknown> = {
      recordNumber: String(v.recordNumber),
      movementType: String(v.movementType),
      productId: String(v.productId),
      batchId: nullable(v.batchId),
      patientId: nullable(v.patientId),
      doctorId: nullable(v.doctorId),
      quantity: numeric(v.quantity),
      prescriptionFolio: nullable(v.prescriptionFolio),
      ispReference: nullable(v.ispReference),
      reason: nullable(v.reason),
    };
    if (v.balanceBefore !== "") {
      payload.balanceBefore = numeric(v.balanceBefore);
    }
    if (v.balanceAfter !== "") {
      payload.balanceAfter = numeric(v.balanceAfter);
    }
    await runApiAction(
      () => api.post("/controlled-drugs", payload),
      setBusy,
      setActionError,
      async () => {
        await recRes.reload();
        close();
      },
    );
  };

  const combinedError =
    recRes.error ||
    prodRes.error ||
    batchRes.error ||
    patientRes.error ||
    doctorRes.error ||
    actionError;

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Trazabilidad"
        title="Medicamentos controlados"
        description="Libro de movimientos y seguimiento de productos sujetos a control."
        actions={
          canManage ? (
            <button
              className="button button--primary"
              onClick={() => setOpen(true)}
            >
              <Plus size={17} />
              Nuevo registro
            </button>
          ) : null
        }
      />
      {recRes.loading ? <PageLoader /> : null}
      {combinedError ? (
        <div className="alert alert--error">{combinedError}</div>
      ) : null}
      {!recRes.loading ? (
        <ControlledSubstanceLedger
          rows={rows}
          filtered={filtered}
          query={q}
          onQueryChange={setQ}
        />
      ) : null}
      <ActionModal
        open={open}
        title="Nuevo registro controlado"
        fields={fields}
        initialValues={defaultControlledInitialValues}
        busy={busy}
        error={actionError}
        onClose={close}
        onSubmit={save}
      />
    </div>
  );
};
