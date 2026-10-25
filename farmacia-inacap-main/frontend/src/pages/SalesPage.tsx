import {
  CircleDollarSign,
  ReceiptText,
  RefreshCcw,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ActionModal, type ActionField } from "../components/ui/ActionModal";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { api } from "../lib/api";
import { translateChoiceLabel } from "../lib/choiceLabels";
import { runApiAction } from "../lib/actionHelpers";

type Sale = {
  id: string;
  code: string;
  saleDate: string;
  totalAmount: number | string;
  status: string;
  seller: { username: string };
  patient: {
    rut: string;
    firstName: string;
    lastName: string;
  } | null;
  taxDocument?: {
    id: string;
    type: string;
    folio: string | null;
    status: string;
  } | null;
};
type SalesResponse = { items: Sale[] };
type SaleActionValues = Record<string, string | number | boolean>;

const emptySales: Sale[] = [];
const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const norm = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const isToday = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const cancelFields: ActionField[] = [
  {
    name: "reason",
    label: "Motivo de anulación",
    type: "textarea",
    required: true,
  },
];

const dteFields: ActionField[] = [{ name: "folio", label: "Folio (opcional)" }];

export const SalesPage = () => {
  const { hasPermission } = useAuth();
  const canCreateSale = hasPermission("sales.create");
  const canCancelSale = hasPermission("sales.cancel");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<Sale | null>(null);
  const [modal, setModal] = useState<"cancel" | "dte" | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const selector = useCallback(
    (payload: SalesResponse) => payload.items,
    [],
  );
  const resource = useResource<Sale[], SalesResponse>(
    "/sales?limit=100",
    selector,
  );
  const rows = resource.data ?? emptySales;
  const filtered = useMemo(
    () =>
      rows.filter(
        (sale) =>
          (status === "ALL" || sale.status === status) &&
          (!query ||
            norm(
              [
                sale.code,
                sale.seller?.username ?? "",
                sale.patient?.rut ?? "",
                sale.patient?.firstName ?? "",
                sale.patient?.lastName ?? "",
              ].join(" "),
            ).includes(norm(query))),
      ),
    [rows, query, status],
  );
  const todaysSales = useMemo(
    () =>
      rows.filter(
        (sale) => sale.status === "COMPLETED" && isToday(sale.saleDate),
      ),
    [rows],
  );
  const todaysTotal = useMemo(
    () =>
      todaysSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
    [todaysSales],
  );
  const averageTicket = todaysSales.length
    ? todaysTotal / todaysSales.length
    : 0;

  const close = () => {
    setModal(null);
    setSelected(null);
    setActionError("");
  };

  const submit = async (values: SaleActionValues) => {
    if (!selected || !modal) return;

    const action =
      modal === "cancel"
        ? () =>
            api.post(`/sales/${selected.id}/cancel`, {
              reason: String(values.reason ?? ""),
            })
        : () =>
            api.post(`/sales/${selected.id}/tax-document/mock-issue`, {
              folio: String(values.folio ?? "") || undefined,
            });

    await runApiAction(action, setBusy, setActionError, async () => {
      await resource.reload();
      close();
    });
  };

  const fields = modal === "cancel" ? cancelFields : dteFields;

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Operación"
        title="Ventas"
        description="Historial de transacciones realizadas en el POS."
        actions={
          <button
            className="button button--secondary"
            onClick={() => void resource.reload()}
          >
            <RefreshCcw size={17} />
            Actualizar
          </button>
        }
      />
      {resource.loading ? <PageLoader /> : null}
      {resource.error || actionError ? (
        <div className="alert alert--error">
          {resource.error || actionError}
        </div>
      ) : null}
      {!resource.loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <ReceiptText size={19} />
              </span>
              <div>
                <span>Ventas hoy</span>
                <strong>{todaysSales.length}</strong>
                <small>Transacciones</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <CircleDollarSign size={19} />
              </span>
              <div>
                <span>Total hoy</span>
                <strong>{clp.format(todaysTotal)}</strong>
                <small>Venta bruta</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <ShoppingBag size={19} />
              </span>
              <div>
                <span>Ticket promedio</span>
                <strong>{clp.format(averageTicket)}</strong>
                <small>Hoy</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <ReceiptText size={19} />
              </span>
              <div>
                <span>Canceladas</span>
                <strong>
                  {rows.filter((sale) => sale.status === "CANCELLED").length}
                </strong>
                <small>Historial</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Historial</span>
                <h2>Transacciones</h2>
              </div>
              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Venta, paciente o vendedor..."
                  />
                </label>
                <select
                  className="module-select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="ALL">Todos</option>
                  {["DRAFT", "COMPLETED", "CANCELLED", "REFUNDED"].map(
                    (value) => (
                      <option value={value} key={value}>
                        {translateChoiceLabel(value)}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
            {filtered.length ? (
              <ResponsiveTable
                rows={filtered}
                getKey={(sale) => sale.id}
                columns={[
                  {
                    key: "code",
                    header: "Venta",
                    render: (sale) => (
                      <div className="cell-stack">
                        <strong>{sale.code}</strong>
                        <span>
                          {new Date(sale.saleDate).toLocaleString("es-CL")}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "patient",
                    header: "Paciente",
                    render: (sale) =>
                      sale.patient
                        ? `${sale.patient.firstName} ${sale.patient.lastName}`
                        : "Venta directa",
                  },
                  {
                    key: "seller",
                    header: "Vendedor",
                    render: (sale) => sale.seller.username,
                  },
                  {
                    key: "total",
                    header: "Total",
                    render: (sale) => clp.format(Number(sale.totalAmount)),
                  },
                  {
                    key: "status",
                    header: "Estado",
                    render: (sale) => <StatusBadge value={sale.status} />,
                  },
                  {
                    key: "actions",
                    header: "Acciones",
                    render: (sale) => {
                      const canIssueDte =
                        sale.status === "COMPLETED" &&
                        sale.taxDocument?.status !== "ISSUED" &&
                        canCreateSale;
                      const canCancel =
                        sale.status === "COMPLETED" && canCancelSale;

                      if (!canIssueDte && !canCancel) {
                        return <span>—</span>;
                      }

                      return (
                        <div className="row-actions">
                          {canIssueDte ? (
                            <button
                              className="row-action"
                              onClick={() => {
                                setSelected(sale);
                                setModal("dte");
                              }}
                            >
                              Emitir DTE
                            </button>
                          ) : null}
                          {canCancel ? (
                            <button
                              className="row-action row-action--danger"
                              onClick={() => {
                                setSelected(sale);
                                setModal("cancel");
                              }}
                            >
                              Anular
                            </button>
                          ) : null}
                        </div>
                      );
                    },
                  },
                ]}
              />
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon">
                  <ReceiptText size={27} />
                </span>
                <strong>Sin ventas</strong>
                <p>Las ventas realizadas en el POS aparecerán aquí.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
      <ActionModal
        open={Boolean(modal)}
        title={modal === "cancel" ? "Anular venta" : "Emitir DTE"}
        fields={fields}
        busy={busy}
        error={actionError}
        onClose={close}
        onSubmit={submit}
      />
    </div>
  );
};
