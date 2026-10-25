import { Banknote, Pencil, Trash2, WalletCards } from "lucide-react";
import { ResponsiveTable } from "../ui/ResponsiveTable";
import { StatusBadge } from "../ui/StatusBadge";

export type CashRegisterItem = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  _count?: { sessions: number };
};

export type CashMovementItem = {
  type: string;
  amount: number | string;
};

export type CashSessionItem = {
  id: string;
  openedAt: string;
  closedAt?: string | null;
  status: string;
  openingAmount: number | string;
  expectedAmount?: number | string | null;
  countedAmount?: number | string | null;
  cashRegister: CashRegisterItem;
  openedBy: { username: string };
  movements?: CashMovementItem[];
  _count?: { sales: number; movements: number };
};

export type CashSummary = {
  open: number;
  opening: number;
  sales: number;
  expected: number;
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

type Props = {
  summary: CashSummary;
  registers: CashRegisterItem[];
  sessions: CashSessionItem[];
  canAdjustCash: boolean;
  canCloseCash: boolean;
  onEditRegister: (register: CashRegisterItem) => void;
  onToggleRegisterStatus: (register: CashRegisterItem, isActive: boolean) => void;
  onOpenMovementModal: (session: CashSessionItem) => void;
  onOpenCloseModal: (session: CashSessionItem) => void;
};

export const CashSessionPanel = ({
  summary,
  registers,
  sessions,
  canAdjustCash,
  canCloseCash,
  onEditRegister,
  onToggleRegisterStatus,
  onOpenMovementModal,
  onOpenCloseModal,
}: Props) => (
  <>
    <section className="module-v2__kpis">
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--green">
          <WalletCards size={19} />
        </span>
        <div>
          <span>Cajas abiertas</span>
          <strong>{summary.open}</strong>
          <small>Sesiones activas</small>
        </div>
      </article>
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--blue">
          <Banknote size={19} />
        </span>
        <div>
          <span>Monto inicial</span>
          <strong>{clp.format(summary.opening)}</strong>
          <small>Sesiones abiertas</small>
        </div>
      </article>
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--amber">
          <Banknote size={19} />
        </span>
        <div>
          <span>Ventas</span>
          <strong>{summary.sales}</strong>
          <small>Sesión actual</small>
        </div>
      </article>
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--violet">
          <Banknote size={19} />
        </span>
        <div>
          <span>Esperado</span>
          <strong>{clp.format(summary.expected)}</strong>
          <small>Según movimientos</small>
        </div>
      </article>
    </section>

    <section className="module-panel">
      <div className="module-panel__header">
        <div>
          <span className="module-panel__eyebrow">Administración</span>
          <h2>Cajas registradas</h2>
        </div>
      </div>
      {registers.length ? (
        <ResponsiveTable
          rows={registers}
          getKey={(r) => r.id}
          columns={[
            { key: "code", header: "Código", render: (r) => r.code },
            { key: "name", header: "Caja", render: (r) => r.name },
            {
              key: "description",
              header: "Descripción",
              render: (r) => r.description || "—",
            },
            {
              key: "sessions",
              header: "Sesiones",
              render: (r) => r._count?.sessions ?? 0,
            },
            {
              key: "status",
              header: "Estado",
              render: (r) => (
                <StatusBadge value={r.isActive ? "ACTIVE" : "INACTIVE"} />
              ),
            },
            {
              key: "actions",
              header: "Acciones",
              render: (r) =>
                canAdjustCash ? (
                  <div className="row-actions">
                    <button
                      className="row-action"
                      onClick={() => onEditRegister(r)}
                    >
                      <Pencil size={13} />
                      Editar
                    </button>
                    {r.isActive ? (
                      <button
                        className="row-action row-action--danger"
                        onClick={() => onToggleRegisterStatus(r, false)}
                      >
                        <Trash2 size={13} />
                        Borrar
                      </button>
                    ) : (
                      <button
                        className="row-action"
                        onClick={() => onToggleRegisterStatus(r, true)}
                      >
                        Reactivar
                      </button>
                    )}
                  </div>
                ) : (
                  <span>—</span>
                ),
            },
          ]}
        />
      ) : (
        <div className="module-empty">
          <strong>Sin cajas</strong>
          <p>Crea una caja para comenzar.</p>
        </div>
      )}
    </section>

    <section className="module-panel">
      <div className="module-panel__header">
        <div>
          <span className="module-panel__eyebrow">Sesiones</span>
          <h2>Control de caja</h2>
        </div>
      </div>
      {sessions.length ? (
        <ResponsiveTable
          rows={sessions}
          getKey={(r) => r.id}
          columns={[
            {
              key: "register",
              header: "Caja",
              render: (r) => r.cashRegister.name,
            },
            {
              key: "opened",
              header: "Apertura",
              render: (r) => new Date(r.openedAt).toLocaleString("es-CL"),
            },
            {
              key: "user",
              header: "Usuario",
              render: (r) => r.openedBy.username,
            },
            {
              key: "amount",
              header: "Inicial",
              render: (r) => clp.format(Number(r.openingAmount)),
            },
            {
              key: "sales",
              header: "Ventas",
              render: (r) => r._count?.sales ?? 0,
            },
            {
              key: "status",
              header: "Estado",
              render: (r) => <StatusBadge value={r.status} />,
            },
            {
              key: "actions",
              header: "Acciones",
              render: (r) =>
                r.status === "OPEN" && (canAdjustCash || canCloseCash) ? (
                  <div className="row-actions">
                    {canAdjustCash ? (
                      <button
                        className="row-action"
                        onClick={() => onOpenMovementModal(r)}
                      >
                        Movimiento
                      </button>
                    ) : null}
                    {canCloseCash ? (
                      <button
                        className="row-action"
                        onClick={() => onOpenCloseModal(r)}
                      >
                        Cerrar
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <span>—</span>
                ),
            },
          ]}
        />
      ) : (
        <div className="module-empty">
          <span className="module-empty__icon">
            <WalletCards size={27} />
          </span>
          <strong>Sin sesiones</strong>
          <p>Abre una caja para comenzar.</p>
        </div>
      )}
    </section>
  </>
);
