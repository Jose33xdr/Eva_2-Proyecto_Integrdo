import { LockKeyhole, Search } from "lucide-react";
import { ResponsiveTable } from "../ui/ResponsiveTable";
import { StatusBadge } from "../ui/StatusBadge";
import { translateChoiceLabel } from "../../lib/choiceLabels";

export type ControlledProduct = {
  id: string;
  sku: string;
  name: string;
  isControlled: boolean;
  isActive: boolean;
};

export type ControlledBatch = {
  id: string;
  batchNumber: string;
  expirationDate?: string;
  isBlocked?: boolean;
  product: { id: string; name: string; isActive?: boolean };
};

export type ControlledPatient = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
};

export type ControlledRecordRow = {
  id: string;
  recordNumber: string;
  movementType: string;
  quantity: number;
  occurredAt: string;
  status: string;
  product: ControlledProduct;
  batch: ControlledBatch | null;
  patient: ControlledPatient | null;
};

type Props = {
  rows: ControlledRecordRow[];
  filtered: ControlledRecordRow[];
  query: string;
  onQueryChange: (value: string) => void;
};

export const ControlledSubstanceLedger = ({
  rows,
  filtered,
  query,
  onQueryChange,
}: Props) => (
  <>
    <section className="module-v2__kpis">
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--danger">
          <LockKeyhole size={19} />
        </span>
        <div>
          <span>Registros</span>
          <strong>{rows.length}</strong>
          <small>Trazados</small>
        </div>
      </article>
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--amber">
          <LockKeyhole size={19} />
        </span>
        <div>
          <span>Unidades</span>
          <strong>{rows.reduce((s, r) => s + Number(r.quantity), 0)}</strong>
          <small>Movidas</small>
        </div>
      </article>
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--blue">
          <LockKeyhole size={19} />
        </span>
        <div>
          <span>Productos</span>
          <strong>
            {new Set(rows.map((r) => r.product?.id).filter(Boolean)).size}
          </strong>
          <small>Controlados</small>
        </div>
      </article>
      <article className="module-kpi">
        <span className="module-kpi__icon module-kpi__icon--violet">
          <LockKeyhole size={19} />
        </span>
        <div>
          <span>Activos</span>
          <strong>{rows.filter((r) => r.status === "ACTIVE").length}</strong>
          <small>Registros</small>
        </div>
      </article>
    </section>
    <section className="module-panel">
      <div className="module-panel__header module-panel__header--filters">
        <div>
          <span className="module-panel__eyebrow">Libro de control</span>
          <h2>Movimientos registrados</h2>
        </div>
        <label className="module-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Registro, producto o lote..."
          />
        </label>
      </div>
      {filtered.length ? (
        <ResponsiveTable
          rows={filtered}
          getKey={(r) => r.id}
          columns={[
            {
              key: "record",
              header: "Registro",
              render: (r) => r.recordNumber,
            },
            {
              key: "product",
              header: "Producto",
              render: (r) => (
                <div className="cell-stack">
                  <strong>{r.product.name}</strong>
                  <span>{r.product.sku}</span>
                </div>
              ),
            },
            {
              key: "movement",
              header: "Movimiento",
              render: (r) => translateChoiceLabel(r.movementType),
            },
            {
              key: "batch",
              header: "Lote",
              render: (r) => r.batch?.batchNumber ?? "—",
            },
            { key: "qty", header: "Cantidad", render: (r) => r.quantity },
            {
              key: "status",
              header: "Estado",
              render: (r) => <StatusBadge value={r.status} />,
            },
          ]}
        />
      ) : (
        <div className="module-empty">
          <span className="module-empty__icon">
            <LockKeyhole size={27} />
          </span>
          <strong>Sin registros</strong>
          <p>Registra el primer movimiento controlado.</p>
        </div>
      )}
    </section>
  </>
);
