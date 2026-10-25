import {
  Building2,
  PackageCheck,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  PurchaseOrderForm,
  type PurchaseLocation,
  type PurchaseModalMode,
  type PurchaseOrderItem,
  type PurchaseProduct,
  type PurchaseSupplier,
} from "../components/inventory/PurchaseOrderForm";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { api } from "../lib/api";
import { nullable, numeric, runApiAction } from "../lib/actionHelpers";

type FormValues = Record<string, string | number | boolean>;

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const PurchasesPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("purchases.create");
  const canReceive = hasPermission("purchases.receive");

  const [q, setQ] = useState("");
  const [modal, setModal] = useState<PurchaseModalMode>(null);
  const [selected, setSelected] = useState<PurchaseOrderItem | null>(null);
  const [receiptCode, setReceiptCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const orderSel = useCallback(
    (p: { items: PurchaseOrderItem[] }) => p.items,
    [],
  );
  const supSel = useCallback((p: { items: PurchaseSupplier[] }) => p.items, []);
  const prodSel = useCallback((p: { items: PurchaseProduct[] }) => p.items, []);
  const locSel = useCallback(
    (p: { locations: PurchaseLocation[] }) => p.locations,
    [],
  );

  const ordersRes = useResource<
    PurchaseOrderItem[],
    { items: PurchaseOrderItem[] }
  >("/purchases?limit=100", orderSel);
  const suppliersRes = useResource<
    PurchaseSupplier[],
    { items: PurchaseSupplier[] }
  >("/suppliers?limit=100", supSel);
  const productsRes = useResource<
    PurchaseProduct[],
    { items: PurchaseProduct[] }
  >("/products?limit=100", prodSel);
  const locRes = useResource<
    PurchaseLocation[],
    { locations: PurchaseLocation[] }
  >("/inventory/locations", locSel);

  const orders = useMemo(() => ordersRes.data ?? [], [ordersRes.data]);
  const suppliers = useMemo(() => suppliersRes.data ?? [], [suppliersRes.data]);
  const products = useMemo(() => productsRes.data ?? [], [productsRes.data]);
  const locations = useMemo(() => locRes.data ?? [], [locRes.data]);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          !q ||
          norm(
            [o.code, o.supplier?.businessName ?? "", o.status].join(" "),
          ).includes(norm(q)),
      ),
    [orders, q],
  );

  const close = () => {
    setModal(null);
    setSelected(null);
    setActionError("");
  };

  const reload = async () => {
    await Promise.all([ordersRes.reload(), suppliersRes.reload()]);
  };

  const submit = async (v: FormValues) => {
    if (modal === "supplier") {
      await runApiAction(
        () =>
          api.post("/suppliers", {
            rut: String(v.rut),
            businessName: String(v.businessName),
            tradeName: nullable(v.tradeName),
            contactName: nullable(v.contactName),
            email: nullable(v.email),
            phone: nullable(v.phone),
            address: nullable(v.address),
            commune: nullable(v.commune),
            region: nullable(v.region),
            isActive: true,
          }),
        setBusy,
        setActionError,
        async () => {
          await suppliersRes.reload();
          close();
        },
      );
    }
    if (modal === "order") {
      await runApiAction(
        () =>
          api.post("/purchases", {
            code: String(v.code),
            supplierId: String(v.supplierId),
            expectedDate: nullable(v.expectedDate),
            notes: nullable(v.notes),
            taxRate: numeric(v.taxRate, 19),
            details: [
              {
                productId: String(v.productId),
                quantityOrdered: numeric(v.quantityOrdered),
                unitCost: numeric(v.unitCost),
              },
            ],
          }),
        setBusy,
        setActionError,
        async () => {
          await ordersRes.reload();
          close();
        },
      );
    }
    if (modal === "status" && selected) {
      await runApiAction(
        () =>
          api.patch(`/purchases/${selected.id}/status`, {
            status: String(v.status),
          }),
        setBusy,
        setActionError,
        async () => {
          await ordersRes.reload();
          close();
        },
      );
    }
    if (modal === "receive" && selected) {
      const items = selected.details
        .filter((d) => d.quantityOrdered > d.quantityReceived)
        .map((d) => ({
          productId: d.productId,
          batchNumber: String(v[`batch_${d.productId}`]),
          expirationDate: String(v[`expiry_${d.productId}`]),
          quantity: numeric(v[`qty_${d.productId}`]),
          purchasePrice: numeric(v[`price_${d.productId}`]),
          locationId: String(v[`loc_${d.productId}`]),
        }))
        .filter((i) => i.quantity > 0);
      await runApiAction(
        () =>
          api.post(`/purchases/${selected.id}/receive`, {
            code: String(v.code),
            notes: nullable(v.notes),
            items,
          }),
        setBusy,
        setActionError,
        async () => {
          await ordersRes.reload();
          close();
        },
      );
    }
  };

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Abastecimiento"
        title="Compras"
        description="Órdenes, proveedores y recepciones de mercadería."
        actions={
          <div className="module-toolbar-actions">
            <button
              className="button button--secondary"
              onClick={() => void reload()}
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>
            {canCreate ? (
              <>
                <button
                  className="button button--secondary"
                  onClick={() => setModal("supplier")}
                >
                  <Building2 size={17} />
                  Nuevo proveedor
                </button>
                <button
                  className="button button--primary"
                  onClick={() => setModal("order")}
                >
                  <Plus size={17} />
                  Nueva orden
                </button>
              </>
            ) : null}
          </div>
        }
      />
      {ordersRes.loading ? <PageLoader /> : null}
      {ordersRes.error ||
      suppliersRes.error ||
      productsRes.error ||
      locRes.error ||
      actionError ? (
        <div className="alert alert--error">
          {ordersRes.error ||
            suppliersRes.error ||
            productsRes.error ||
            locRes.error ||
            actionError}
        </div>
      ) : null}
      {!ordersRes.loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <ShoppingBag size={19} />
              </span>
              <div>
                <span>Órdenes</span>
                <strong>{orders.length}</strong>
                <small>Registradas</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <PackageCheck size={19} />
              </span>
              <div>
                <span>Pendientes</span>
                <strong>
                  {
                    orders.filter(
                      (o) => !["RECEIVED", "CANCELLED"].includes(o.status),
                    ).length
                  }
                </strong>
                <small>Por recibir</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Building2 size={19} />
              </span>
              <div>
                <span>Proveedores</span>
                <strong>{suppliers.length}</strong>
                <small>Registrados</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <ShoppingBag size={19} />
              </span>
              <div>
                <span>Total</span>
                <strong>
                  {clp.format(
                    orders.reduce((s, o) => s + Number(o.totalAmount), 0),
                  )}
                </strong>
                <small>Historial</small>
              </div>
            </article>
          </section>
          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Órdenes</span>
                <h2>Gestión de compras</h2>
              </div>
              <label className="module-search">
                <Search size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Orden o proveedor..."
                />
              </label>
            </div>
            {filtered.length ? (
              <ResponsiveTable
                rows={filtered}
                getKey={(r) => r.id}
                columns={[
                  {
                    key: "code",
                    header: "Orden",
                    render: (r) => (
                      <div className="cell-stack">
                        <strong>{r.code}</strong>
                        <span>
                          {new Date(r.orderDate).toLocaleDateString("es-CL")}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "supplier",
                    header: "Proveedor",
                    render: (r) => r.supplier.businessName,
                  },
                  {
                    key: "total",
                    header: "Total",
                    render: (r) => clp.format(Number(r.totalAmount)),
                  },
                  {
                    key: "status",
                    header: "Estado",
                    render: (r) => <StatusBadge value={r.status} />,
                  },
                  {
                    key: "actions",
                    header: "Acciones",
                    render: (r) => {
                      const canReceiveOrder =
                        canReceive &&
                        !["RECEIVED", "CANCELLED"].includes(r.status);
                      if (!canCreate && !canReceiveOrder) {
                        return <span>—</span>;
                      }
                      return (
                        <div className="row-actions">
                          {canCreate ? (
                            <button
                              className="row-action"
                              onClick={() => {
                                setSelected(r);
                                setModal("status");
                              }}
                            >
                              Estado
                            </button>
                          ) : null}
                          {canReceiveOrder ? (
                            <button
                              className="row-action"
                              onClick={() => {
                                setSelected(r);
                                setReceiptCode(`REC-${Date.now()}`);
                                setModal("receive");
                              }}
                            >
                              Recepcionar
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
                  <ShoppingBag size={27} />
                </span>
                <strong>Sin órdenes</strong>
                <p>Crea la primera orden de compra.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
      <PurchaseOrderForm
        mode={modal}
        selected={selected}
        receiptCode={receiptCode}
        suppliers={suppliers}
        products={products}
        locations={locations}
        busy={busy}
        error={actionError}
        onClose={close}
        onSubmit={submit}
      />
    </div>
  );
};
