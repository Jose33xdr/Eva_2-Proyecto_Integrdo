import { WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PosCartTable,
  type PosCartItem,
  type PosPatient,
} from "../components/pos/PosCartTable";
import {
  PosCheckoutModal,
  type CheckoutValues,
} from "../components/pos/PosCheckoutModal";
import {
  PosProductSearch,
  type PosProduct,
} from "../components/pos/PosProductSearch";
import "../components/pos/pos.module.css";
import { api, getApiErrorMessage } from "../lib/api";
import { nullable, numeric, runApiAction } from "../lib/actionHelpers";
import {
  getAvailableStockByProduct,
  type InventoryStockRow,
} from "../lib/posInventory";

type CashSession = {
  id: string;
  status: string;
  cashRegister?: { name: string } | null;
};
type RxItem = { id: string; productId: string; remainingQuantity: number };
type Rx = {
  id: string;
  status: string;
  expirationDate?: string | null;
  patientId: string;
  patient: PosPatient;
  items: RxItem[];
};
type PosData = {
  products: PosProduct[];
  stockRows: InventoryStockRow[];
  cashSessions: CashSession[];
  patients: PosPatient[];
  prescriptions: Rx[];
};
type ItemsResponse<T> = { items?: T[] };
type SessionsResponse = { sessions?: CashSession[] };

const norm = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const PosPage = () => {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [stockRows, setStockRows] = useState<InventoryStockRow[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [patients, setPatients] = useState<PosPatient[]>([]);
  const [prescriptions, setPrescriptions] = useState<Rx[]>([]);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("TODAS");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (): Promise<PosData> => {
    const [
      productsResponse,
      stockResponse,
      sessionsResponse,
      patientsResponse,
      prescriptionsResponse,
    ] = await Promise.all([
      api.get<ItemsResponse<PosProduct>>("/products?limit=100"),
      api.get<ItemsResponse<InventoryStockRow>>("/inventory/stock?limit=100"),
      api.get<SessionsResponse>("/cash/sessions?limit=100"),
      api.get<ItemsResponse<PosPatient>>("/patients?limit=100&active=true"),
      api.get<ItemsResponse<Rx>>("/prescriptions?limit=100"),
    ]);

    return {
      products: productsResponse.data.items ?? [],
      stockRows: stockResponse.data.items ?? [],
      cashSessions: sessionsResponse.data.sessions ?? [],
      patients: patientsResponse.data.items ?? [],
      prescriptions: prescriptionsResponse.data.items ?? [],
    };
  }, []);

  const applyData = useCallback((data: PosData) => {
    setProducts(data.products);
    setStockRows(data.stockRows);
    setCashSessions(data.cashSessions);
    setPatients(data.patients);
    setPrescriptions(data.prescriptions);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      applyData(await fetchData());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [applyData, fetchData]);

  useEffect(() => {
    let active = true;

    void fetchData()
      .then((data) => {
        if (active) {
          applyData(data);
          setLoading(false);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(getApiErrorMessage(requestError));
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applyData, fetchData]);

  const stockByProduct = useMemo(
    () => getAvailableStockByProduct(stockRows),
    [stockRows],
  );

  const categories = useMemo(
    () => [
      "TODAS",
      ...Array.from(
        new Set(
          products
            .map((product) => product.category?.name)
            .filter((name): name is string => Boolean(name)),
        ),
      ).sort((a, b) => a.localeCompare(b, "es")),
    ],
    [products],
  );
  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive &&
          (category === "TODAS" || product.category?.name === category) &&
          (!query ||
            norm(
              [
                product.name,
                product.sku,
                product.barcode ?? "",
                product.category?.name ?? "",
                product.laboratory?.name ?? "",
              ].join(" "),
            ).includes(norm(query))),
      ),
    [products, category, query],
  );
  const openCash =
    cashSessions.find((session) => session.status === "OPEN") ?? null;
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) ?? null;
  const total = cart.reduce(
    (sum, item) => sum + Number(item.product.salePrice) * item.quantity,
    0,
  );
  const units = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasAvailableStock = products.some(
    (product) =>
      product.isActive && (stockByProduct.get(product.id) ?? 0) > 0,
  );

  const needsPrescription = (product: PosProduct) =>
    product.requiresPrescription || product.isControlled;

  const findPrescriptionItem = (product: PosProduct): RxItem | null | undefined => {
    if (!needsPrescription(product)) return null;
    if (!selectedPatientId) return undefined;

    const now = new Date().getTime();
    const prescription = prescriptions.find(
      (candidate) =>
        candidate.patientId === selectedPatientId &&
        ["ACTIVE", "PARTIALLY_DISPENSED"].includes(candidate.status) &&
        (!candidate.expirationDate ||
          new Date(candidate.expirationDate).getTime() > now) &&
        candidate.items.some(
          (item) =>
            item.productId === product.id && item.remainingQuantity > 0,
        ),
    );
    return (
      prescription?.items.find(
        (item) => item.productId === product.id && item.remainingQuantity > 0,
      ) ?? undefined
    );
  };

  const add = (product: PosProduct) => {
    const stock = stockByProduct.get(product.id) ?? 0;
    if (stock <= 0) return;

    const requiresRx = needsPrescription(product);
    const prescriptionItem = findPrescriptionItem(product);
    if (requiresRx && !prescriptionItem) {
      setError(
        selectedPatientId
          ? "El paciente no tiene una receta vigente con saldo para este producto."
          : "Selecciona un paciente antes de agregar medicamentos con receta o controlados.",
      );
      return;
    }

    const maxQuantity = prescriptionItem
      ? Math.min(stock, prescriptionItem.remainingQuantity)
      : stock;

    if (maxQuantity <= 0) return;

    setError("");
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                stock,
                maxQuantity,
                quantity: Math.min(item.quantity + 1, maxQuantity),
                prescriptionItemId:
                  prescriptionItem?.id ?? item.prescriptionItemId,
              }
            : item,
        );
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
          stock,
          maxQuantity,
          prescriptionItemId: prescriptionItem?.id ?? null,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) =>
    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) return item;
          const rxItem = findPrescriptionItem(item.product);
          const maxQuantity = rxItem
            ? Math.min(item.stock, rxItem.remainingQuantity)
            : item.maxQuantity;

          return {
            ...item,
            maxQuantity,
            quantity: Math.min(Math.max(quantity, 0), maxQuantity),
          };
        })
        .filter((item) => item.quantity > 0),
    );

  const checkoutInitialValues = useMemo(
    () => ({
      paymentMethod: "CASH",
      taxDocumentType: "RECEIPT",
      customerRut: selectedPatient?.rut ?? "",
      customerName: selectedPatient
        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
        : "",
    }),
    [selectedPatient],
  );

  const checkout = async (values: CheckoutValues) => {
    if (!openCash) {
      setError("Debes abrir una caja antes de cobrar.");
      return;
    }

    const taxDocumentType = String(values.taxDocumentType);
    const customerRut =
      nullable(values.customerRut) || selectedPatient?.rut || null;
    const customerBusinessName = nullable(values.customerBusinessName);
    const customerBusinessActivity = nullable(values.customerBusinessActivity);
    const customerAddress = nullable(values.customerAddress);

    if (
      taxDocumentType === "INVOICE" &&
      (!customerRut ||
        !customerBusinessName ||
        !customerBusinessActivity ||
        !customerAddress)
    ) {
      setError(
        "Para emitir factura debes completar RUT cliente, razón social, giro y dirección.",
      );
      return;
    }

    await runApiAction(
      () =>
        api.post("/sales/checkout", {
          code: `VTA-${Date.now()}`,
          cashSessionId: openCash.id,
          patientId: selectedPatientId || null,
          customerRut,
          customerName:
            nullable(values.customerName) ||
            (selectedPatient
              ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
              : null),
          customerBusinessName,
          customerBusinessActivity,
          customerAddress,
          notes: nullable(values.notes),
          taxRate: 19,
          taxDocumentType,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            discountAmount: 0,
            prescriptionItemId: item.prescriptionItemId ?? null,
            locationId: null,
          })),
          payments: [
            {
              method: String(values.paymentMethod),
              amount: numeric(total),
              referenceCode: nullable(values.referenceCode),
            },
          ],
        }),
      setBusy,
      setError,
      async () => {
        setCart([]);
        setCheckoutOpen(false);
        await load();
      },
    );
  };

  return (
    <div className="pos-v2">
      <header className="pos-v2__header">
        <div>
          <span className="pos-v2__eyebrow">Punto de venta</span>
          <h1>POS</h1>
          <p>Venta rápida con inventario por lote, receta y control FEFO.</p>
        </div>
        <div
          className={`pos-v2__cash ${openCash ? "pos-v2__cash--open" : ""}`}
        >
          <WalletCards size={17} />
          <div>
            <span>Estado de caja</span>
            <strong>
              {openCash
                ? (openCash.cashRegister?.name ?? "Caja abierta")
                : "Sin caja abierta"}
            </strong>
          </div>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading && (!openCash || !hasAvailableStock) ? (
        <div className="alert" role="status">
          <strong>Antes de vender:</strong>{" "}
          {!openCash ? "abre una caja. " : ""}
          {!hasAvailableStock
            ? "recibe una compra con lote y cantidad para habilitar productos. "
            : ""}
          <span>
            {!openCash ? <Link to="/cash">Ir a Control de caja</Link> : null}
            {!openCash && !hasAvailableStock ? " · " : null}
            {!hasAvailableStock ? (
              <Link to="/purchases">Ir a Compras</Link>
            ) : null}
          </span>
        </div>
      ) : null}

      <section className="pos-v2__layout">
        <PosProductSearch
          query={query}
          category={category}
          categories={categories}
          products={filtered}
          stockByProduct={stockByProduct}
          loading={loading}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          onReload={() => void load()}
          onAddProduct={add}
        />

        <PosCartTable
          cart={cart}
          units={units}
          total={total}
          patients={patients}
          selectedPatientId={selectedPatientId}
          selectedPatient={selectedPatient}
          hasOpenCash={Boolean(openCash)}
          onSelectPatient={(patientId) => {
            setSelectedPatientId(patientId);
            setCart([]);
          }}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={(productId) =>
            setCart((current) =>
              current.filter((candidate) => candidate.product.id !== productId),
            )
          }
          onOpenCheckout={() => setCheckoutOpen(true)}
        />
      </section>

      <PosCheckoutModal
        open={checkoutOpen}
        total={total}
        initialValues={checkoutInitialValues}
        busy={busy}
        error={error}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={checkout}
      />
    </div>
  );
};
