import { BadgePercent, Handshake, Layers3, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ActionModal, type ActionField } from "../components/ui/ActionModal";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { api } from "../lib/api";
import { nullable, numeric, runApiAction } from "../lib/actionHelpers";
import { translateChoiceLabel } from "../lib/choiceLabels";

type Product = { id: string; sku: string; name: string; isActive: boolean };
type Benefit = {
  id: string;
  productId?: string | null;
  discountType: string;
  discountValue: number | string;
  minimumQuantity: number;
  isActive: boolean;
  product?: Product | null;
};
type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  benefits: Benefit[];
  _count?: { coverages: number };
};
type Agreement = {
  id: string;
  code: string;
  name: string;
  type: string;
  rut?: string | null;
  description?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  plans: Plan[];
};
type FormValues = Record<string, string | number | boolean>;

const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const agreementFields: ActionField[] = [
  { name: "code", label: "Código", required: true },
  { name: "name", label: "Nombre", required: true },
  {
    name: "type",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      "ISAPRE",
      "INSURANCE",
      "CENABAST",
      "EMPLOYEE",
      "INSTITUTIONAL",
      "OTHER",
    ].map((v) => ({ value: v, label: translateChoiceLabel(v) })),
  },
  { name: "rut", label: "RUT" },
  { name: "validFrom", label: "Vigente desde", type: "date" },
  { name: "validUntil", label: "Vigente hasta", type: "date" },
  { name: "description", label: "Descripción", type: "textarea" },
  { name: "isActive", label: "Activo", type: "checkbox" },
];

const planFields: ActionField[] = [
  { name: "code", label: "Código plan", required: true },
  { name: "name", label: "Nombre plan", required: true },
  { name: "validFrom", label: "Vigente desde", type: "date" },
  { name: "validUntil", label: "Vigente hasta", type: "date" },
  { name: "description", label: "Descripción", type: "textarea" },
  { name: "isActive", label: "Activo", type: "checkbox" },
];

export const AgreementsPage = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("agreements.manage");

  const [q, setQ] = useState("");
  const [modal, setModal] = useState<"agreement" | "plan" | "benefit" | null>(
    null,
  );
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(
    null,
  );
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editing, setEditing] = useState<Agreement | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const agSel = useCallback(
    (p: { agreements: Agreement[] }) => p.agreements,
    [],
  );
  const prodSel = useCallback((p: { items: Product[] }) => p.items, []);

  const res = useResource<Agreement[], { agreements: Agreement[] }>(
    "/agreements",
    agSel,
  );
  const productsRes = useResource<Product[], { items: Product[] }>(
    "/products?limit=100",
    prodSel,
  );

  const rows = useMemo(() => res.data ?? [], [res.data]);
  const products = useMemo(
    () => (productsRes.data ?? []).filter((p) => p.isActive !== false),
    [productsRes.data],
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !q ||
          norm([r.code, r.name, r.type, r.rut ?? ""].join(" ")).includes(
            norm(q),
          ),
      ),
    [rows, q],
  );

  const close = () => {
    setModal(null);
    setSelectedAgreement(null);
    setSelectedPlan(null);
    setEditing(null);
    setActionError("");
  };

  const submit = async (v: FormValues) => {
    if (modal === "agreement") {
      const payload = {
        code: String(v.code),
        name: String(v.name),
        type: String(v.type),
        rut: nullable(v.rut),
        description: nullable(v.description),
        validFrom: nullable(v.validFrom),
        validUntil: nullable(v.validUntil),
        isActive: Boolean(v.isActive),
      };
      await runApiAction(
        () =>
          editing
            ? api.patch(`/agreements/${editing.id}`, payload)
            : api.post("/agreements", payload),
        setBusy,
        setActionError,
        async () => {
          await res.reload();
          close();
        },
      );
    }
    if (modal === "plan" && selectedAgreement) {
      await runApiAction(
        () =>
          api.post(`/agreements/${selectedAgreement.id}/plans`, {
            code: String(v.code),
            name: String(v.name),
            description: nullable(v.description),
            validFrom: nullable(v.validFrom),
            validUntil: nullable(v.validUntil),
            isActive: Boolean(v.isActive),
          }),
        setBusy,
        setActionError,
        async () => {
          await res.reload();
          close();
        },
      );
    }
    if (modal === "benefit") {
      const targetPlanId = String(v.planId || selectedPlan?.id || "");
      if (!targetPlanId) {
        setActionError("Debes seleccionar un plan del convenio.");
        return;
      }
      await runApiAction(
        () =>
          api.post(`/agreements/plans/${targetPlanId}/benefits`, {
            productId: nullable(v.productId),
            discountType: String(v.discountType),
            discountValue: numeric(v.discountValue),
            maximumDiscount:
              v.maximumDiscount === "" ? null : numeric(v.maximumDiscount),
            minimumQuantity: numeric(v.minimumQuantity, 1),
            validFrom: nullable(v.validFrom),
            validUntil: nullable(v.validUntil),
            isActive: true,
          }),
        setBusy,
        setActionError,
        async () => {
          await res.reload();
          close();
        },
      );
    }
  };

  const fields = useMemo<ActionField[]>(() => {
    if (modal === "agreement") return agreementFields;
    if (modal === "plan") return planFields;
    if (modal === "benefit") {
      const availablePlans = selectedAgreement?.plans ?? (selectedPlan ? [selectedPlan] : []);
      return [
        {
          name: "planId",
          label: "Plan del convenio",
          type: "select",
          required: true,
          options: availablePlans.map((plan) => ({
            value: plan.id,
            label: `${plan.code} · ${plan.name}`,
          })),
        },
        {
          name: "productId",
          label: "Producto (vacío = todos)",
          type: "select",
          options: products.map((p) => ({
            value: p.id,
            label: `${p.sku} · ${p.name}`,
          })),
        },
        {
          name: "discountType",
          label: "Tipo descuento",
          type: "select",
          required: true,
          options: ["PERCENTAGE", "FIXED_AMOUNT", "FIXED_PRICE"].map((v) => ({
            value: v,
            label: translateChoiceLabel(v),
          })),
        },
        {
          name: "discountValue",
          label: "Valor descuento",
          type: "number",
          min: 0,
          required: true,
        },
        { name: "maximumDiscount", label: "Tope descuento", type: "number", min: 0 },
        {
          name: "minimumQuantity",
          label: "Cantidad mínima",
          type: "number",
          min: 1,
          required: true,
        },
        { name: "validFrom", label: "Vigente desde", type: "date" },
        { name: "validUntil", label: "Vigente hasta", type: "date" },
      ];
    }
    return [];
  }, [modal, selectedAgreement, selectedPlan, products]);

  const initialValues = useMemo<Record<string, unknown>>(() => {
    if (modal === "agreement") {
      return editing ?? { type: "ISAPRE", isActive: true };
    }
    if (modal === "plan") {
      return { isActive: true };
    }
    return {
      planId: selectedPlan?.id ?? selectedAgreement?.plans[0]?.id ?? "",
      discountType: "PERCENTAGE",
      minimumQuantity: 1,
    };
  }, [modal, editing, selectedPlan, selectedAgreement]);

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Beneficios"
        title="Convenios y coberturas"
        description="Isapres, seguros, Cenabast y convenios institucionales."
        actions={
          canManage ? (
            <button
              className="button button--primary"
              onClick={() => {
                setEditing(null);
                setModal("agreement");
              }}
            >
              <Plus size={17} />
              Nuevo convenio
            </button>
          ) : null
        }
      />
      {res.loading ? <PageLoader /> : null}
      {res.error || productsRes.error || actionError ? (
        <div className="alert alert--error">
          {res.error || productsRes.error || actionError}
        </div>
      ) : null}
      {!res.loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <Handshake size={19} />
              </span>
              <div>
                <span>Convenios</span>
                <strong>{rows.length}</strong>
                <small>Configurados</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Handshake size={19} />
              </span>
              <div>
                <span>Activos</span>
                <strong>{rows.filter((r) => r.isActive).length}</strong>
                <small>Aplicables</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <Layers3 size={19} />
              </span>
              <div>
                <span>Planes</span>
                <strong>
                  {rows.reduce((s, r) => s + r.plans.length, 0)}
                </strong>
                <small>Configurados</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <BadgePercent size={19} />
              </span>
              <div>
                <span>Beneficios</span>
                <strong>
                  {rows.reduce(
                    (s, r) =>
                      s + r.plans.reduce((a, p) => a + p.benefits.length, 0),
                    0,
                  )}
                </strong>
                <small>Reglas</small>
              </div>
            </article>
          </section>
          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Beneficios</span>
                <h2>Convenios configurados</h2>
              </div>
              <label className="module-search">
                <Search size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Código, convenio o tipo..."
                />
              </label>
            </div>
            {filtered.length ? (
              <ResponsiveTable
                rows={filtered}
                getKey={(r) => r.id}
                columns={[
                  { key: "code", header: "Código", render: (r) => r.code },
                  { key: "name", header: "Convenio", render: (r) => r.name },
                  {
                    key: "type",
                    header: "Tipo",
                    render: (r) => translateChoiceLabel(r.type),
                  },
                  {
                    key: "plans",
                    header: "Planes",
                    render: (r) => r.plans.length,
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
                      canManage ? (
                        <div className="row-actions">
                          <button
                            className="row-action"
                            onClick={() => {
                              setEditing(r);
                              setModal("agreement");
                            }}
                          >
                            Editar
                          </button>
                          <button
                            className="row-action"
                            onClick={() => {
                              setSelectedAgreement(r);
                              setModal("plan");
                            }}
                          >
                            + Plan
                          </button>
                          {r.plans.length > 0 ? (
                            <button
                              className="row-action"
                              onClick={() => {
                                setSelectedAgreement(r);
                                setSelectedPlan(r.plans[0]);
                                setModal("benefit");
                              }}
                            >
                              + Beneficio
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
                  <Handshake size={27} />
                </span>
                <strong>Sin convenios</strong>
                <p>Crea el primer convenio.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
      <ActionModal
        open={Boolean(modal)}
        title={
          modal === "agreement"
            ? editing
              ? "Editar convenio"
              : "Nuevo convenio"
            : modal === "plan"
              ? "Nuevo plan"
              : "Nuevo beneficio"
        }
        fields={fields}
        initialValues={initialValues}
        busy={busy}
        error={actionError}
        onClose={close}
        onSubmit={submit}
      />
    </div>
  );
};
