import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  CheckCircle2,
  PackageCheck,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { ResponsiveTable } from "../ui/ResponsiveTable";
import { StatusBadge } from "../ui/StatusBadge";
import { translateChoiceLabel } from "../../lib/choiceLabels";

export type InventoryLocationItem = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type InventoryStockItem = {
  id: string;
  quantity: number;
  reservedQuantity: number;
  location: InventoryLocationItem;
  batch: {
    id: string;
    batchNumber: string;
    expirationDate: string;
    product: { id: string; sku: string; name: string };
  };
};

export type InventoryAlertItem = {
  id: string;
  type: string;
  status: string;
  title?: string;
  message?: string;
  product?: { name: string } | null;
  batch?: { batchNumber: string } | null;
};

type Props = {
  rows: InventoryStockItem[];
  filtered: InventoryStockItem[];
  pendingAlertsList: InventoryAlertItem[];
  available: number;
  expired: number;
  pendingAlerts: number;
  query: string;
  busy: boolean;
  canUpdate: boolean;
  canAdjust: boolean;
  onQueryChange: (value: string) => void;
  onResolveAlert: (alertId: string) => void;
  onOpenAdjust: (row: InventoryStockItem) => void;
  onOpenTransfer: (row: InventoryStockItem) => void;
};

export const BatchStockTable = ({
  rows,
  filtered,
  pendingAlertsList,
  available,
  expired,
  pendingAlerts,
  query,
  busy,
  canUpdate,
  canAdjust,
  onQueryChange,
  onResolveAlert,
  onOpenAdjust,
  onOpenTransfer,
}: Props) => (
  <>
    <section className="module-v2__kpis">
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--green">
          <PackageCheck size={19} />
        </span>
        <div>
          <span>Disponible</span>
          <strong>{available}</strong>
          <small>Unidades</small>
        </div>
      </article>
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--blue">
          <Boxes size={19} />
        </span>
        <div>
          <span>Lotes</span>
          <strong>{rows.length}</strong>
          <small>Con stock</small>
        </div>
      </article>
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--amber">
          <AlertTriangle size={19} />
        </span>
        <div>
          <span>Alertas</span>
          <strong>{pendingAlerts}</strong>
          <small>Pendientes</small>
        </div>
      </article>
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--danger">
          <AlertTriangle size={19} />
        </span>
        <div>
          <span>Vencidos</span>
          <strong>{expired}</strong>
          <small>Lotes</small>
        </div>
      </article>
    </section>

    {pendingAlertsList.length ? (
      <section className="module-panel">
        <div className="module-panel__header">
          <div>
            <span className="module-panel__eyebrow">Seguimiento</span>
            <h2>Alertas pendientes</h2>
          </div>
        </div>
        <ResponsiveTable
          rows={pendingAlertsList}
          getKey={(a) => a.id}
          columns={[
            {
              key: "type",
              header: "Tipo",
              render: (a) => translateChoiceLabel(a.type),
            },
            {
              key: "product",
              header: "Producto / Lote",
              render: (a) => (
                <div className="cell-stack">
                  <strong>{a.product?.name ?? a.title ?? "Alerta"}</strong>
                  <span>
                    {a.batch?.batchNumber
                      ? `Lote ${a.batch.batchNumber}`
                      : (a.message ?? "—")}
                  </span>
                </div>
              ),
            },
            {
              key: "status",
              header: "Estado",
              render: (a) => <StatusBadge value={a.status} />,
            },
            {
              key: "actions",
              header: "Acciones",
              render: (a) =>
                canUpdate && a.status === "PENDING" ? (
                  <div className="row-actions">
                    <button
                      className="row-action"
                      disabled={busy}
                      onClick={() => onResolveAlert(a.id)}
                    >
                      <CheckCircle2 size={12} /> Resolver
                    </button>
                  </div>
                ) : (
                  <span>—</span>
                ),
            },
          ]}
        />
      </section>
    ) : null}

    <section className="module-panel">
      <div className="module-panel__header module-panel__header--filters">
        <div>
          <span className="module-panel__eyebrow">Existencias</span>
          <h2>Inventario disponible</h2>
        </div>
        <label className="module-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Producto, SKU, lote..."
          />
        </label>
      </div>
      {filtered.length ? (
        <ResponsiveTable
          rows={filtered}
          getKey={(r) => r.id}
          columns={[
            {
              key: "product",
              header: "Producto",
              render: (r) => (
                <div className="cell-stack">
                  <strong>{r.batch.product.name}</strong>
                  <span>{r.batch.product.sku}</span>
                </div>
              ),
            },
            {
              key: "batch",
              header: "Lote",
              render: (r) => r.batch.batchNumber,
            },
            {
              key: "loc",
              header: "Ubicación",
              render: (r) => r.location.name,
            },
            {
              key: "available",
              header: "Disponible",
              render: (r) => r.quantity - r.reservedQuantity,
            },
            {
              key: "expiry",
              header: "Vencimiento",
              render: (r) =>
                new Date(r.batch.expirationDate).toLocaleDateString("es-CL"),
            },
            {
              key: "actions",
              header: "Acciones",
              render: (r) =>
                canAdjust || canUpdate ? (
                  <div className="row-actions">
                    {canAdjust ? (
                      <button
                        className="row-action"
                        onClick={() => onOpenAdjust(r)}
                      >
                        <SlidersHorizontal size={12} /> Ajustar
                      </button>
                    ) : null}
                    {canUpdate ? (
                      <button
                        className="row-action"
                        onClick={() => onOpenTransfer(r)}
                      >
                        <ArrowLeftRight size={12} /> Transferir
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
            <Boxes size={27} />
          </span>
          <strong>Sin stock</strong>
          <p>Las recepciones aparecerán aquí.</p>
        </div>
      )}
    </section>
  </>
);
