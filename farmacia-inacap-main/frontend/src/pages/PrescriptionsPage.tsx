import { FileText, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  PrescriptionForm,
  type ClinicalDoctor,
  type ClinicalPatient,
  type ClinicalProduct,
  type PrescriptionFormValues,
} from "../components/clinical/PrescriptionForm";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { api } from "../lib/api";
import { nullable, numeric, runApiAction } from "../lib/actionHelpers";
import { translateChoiceLabel } from "../lib/choiceLabels";

type Rx = {
  id: string;
  folio: string;
  origin: string;
  prescriptionType: string;
  issueDate: string;
  expirationDate: string | null;
  status: string;
  patient: ClinicalPatient;
  doctor: ClinicalDoctor;
  items: Array<{
    id: string;
    product: ClinicalProduct;
    prescribedQuantity: number;
    remainingQuantity: number;
  }>;
};

const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const PrescriptionsPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("prescriptions.create");
  const canCancel = hasPermission("prescriptions.cancel");

  const [q, setQ] = useState("");
  const [modal, setModal] = useState<"create" | "cancel" | null>(null);
  const [selected, setSelected] = useState<Rx | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [todayDate] = useState(() => new Date().toISOString().slice(0, 10));

  const rxSel = useCallback((p: { items: Rx[] }) => p.items, []);
  const patientSel = useCallback(
    (p: { items: ClinicalPatient[] }) => p.items,
    [],
  );
  const doctorSel = useCallback(
    (p: { items: ClinicalDoctor[] }) => p.items,
    [],
  );
  const productSel = useCallback(
    (p: { items: ClinicalProduct[] }) => p.items,
    [],
  );

  const rxRes = useResource<Rx[], { items: Rx[] }>(
    "/prescriptions?limit=100",
    rxSel,
  );
  const patientsRes = useResource<ClinicalPatient[], { items: ClinicalPatient[] }>(
    "/patients?limit=100",
    patientSel,
  );
  const doctorsRes = useResource<ClinicalDoctor[], { items: ClinicalDoctor[] }>(
    "/doctors?limit=100",
    doctorSel,
  );
  const productsRes = useResource<ClinicalProduct[], { items: ClinicalProduct[] }>(
    "/products?limit=100",
    productSel,
  );

  const rows = useMemo(() => rxRes.data ?? [], [rxRes.data]);
  const patients = useMemo(() => patientsRes.data ?? [], [patientsRes.data]);
  const doctors = useMemo(() => doctorsRes.data ?? [], [doctorsRes.data]);
  const products = useMemo(() => productsRes.data ?? [], [productsRes.data]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !q ||
          norm(
            [
              r.folio,
              r.patient.rut,
              r.patient.firstName,
              r.patient.lastName,
              r.doctor.firstName,
              r.doctor.lastName,
            ].join(" "),
          ).includes(norm(q)),
      ),
    [rows, q],
  );

  const close = () => {
    setModal(null);
    setSelected(null);
    setActionError("");
  };

  const submit = async (v: PrescriptionFormValues) => {
    if (modal === "create") {
      await runApiAction(
        () =>
          api.post("/prescriptions", {
            folio: String(v.folio),
            origin: String(v.origin),
            prescriptionType: String(v.prescriptionType),
            issueDate: String(v.issueDate),
            expirationDate: nullable(v.expirationDate),
            hasBalanceControl: Boolean(v.hasBalanceControl),
            patientId: String(v.patientId),
            doctorId: String(v.doctorId),
            notes: nullable(v.notes),
            fileUrl: nullable(v.fileUrl),
            retainedFileUrl: nullable(v.retainedFileUrl),
            items: [
              {
                productId: String(v.productId),
                prescribedQuantity: numeric(v.prescribedQuantity),
                dosage: nullable(v.dosage),
                frequency: nullable(v.frequency),
                duration: nullable(v.duration),
              },
            ],
          }),
        setBusy,
        setActionError,
        async () => {
          await rxRes.reload();
          close();
        },
      );
    }
    if (modal === "cancel" && selected) {
      await runApiAction(
        () =>
          api.post(`/prescriptions/${selected.id}/cancel`, {
            reason: String(v.reason),
          }),
        setBusy,
        setActionError,
        async () => {
          await rxRes.reload();
          close();
        },
      );
    }
  };

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Dispensación"
        title="Recetas"
        description="Seguimiento de vigencia, saldo y dispensación de recetas."
        actions={
          canCreate ? (
            <button
              className="button button--primary"
              onClick={() => setModal("create")}
            >
              <Plus size={17} />
              Nueva receta
            </button>
          ) : null
        }
      />
      {rxRes.loading ? <PageLoader /> : null}
      {rxRes.error ||
      patientsRes.error ||
      doctorsRes.error ||
      productsRes.error ||
      actionError ? (
        <div className="alert alert--error">
          {rxRes.error ||
            patientsRes.error ||
            doctorsRes.error ||
            productsRes.error ||
            actionError}
        </div>
      ) : null}
      {!rxRes.loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <FileText size={19} />
              </span>
              <div>
                <span>Recetas</span>
                <strong>{rows.length}</strong>
                <small>Registradas</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <FileText size={19} />
              </span>
              <div>
                <span>Activas</span>
                <strong>
                  {
                    rows.filter((r) =>
                      ["ACTIVE", "PARTIALLY_DISPENSED"].includes(r.status),
                    ).length
                  }
                </strong>
                <small>Vigentes</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <FileText size={19} />
              </span>
              <div>
                <span>Dispensadas</span>
                <strong>
                  {rows.filter((r) => r.status === "DISPENSED").length}
                </strong>
                <small>Completas</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--danger">
                <FileText size={19} />
              </span>
              <div>
                <span>Canceladas</span>
                <strong>
                  {rows.filter((r) => r.status === "CANCELLED").length}
                </strong>
                <small>No utilizables</small>
              </div>
            </article>
          </section>
          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Seguimiento</span>
                <h2>Recetas registradas</h2>
              </div>
              <label className="module-search">
                <Search size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Folio, paciente o médico..."
                />
              </label>
            </div>
            {filtered.length ? (
              <ResponsiveTable
                rows={filtered}
                getKey={(r) => r.id}
                columns={[
                  { key: "folio", header: "Folio", render: (r) => r.folio },
                  {
                    key: "patient",
                    header: "Paciente",
                    render: (r) => (
                      <div className="cell-stack">
                        <strong>
                          {r.patient.firstName} {r.patient.lastName}
                        </strong>
                        <span>{r.patient.rut}</span>
                      </div>
                    ),
                  },
                  {
                    key: "doctor",
                    header: "Médico",
                    render: (r) => `${r.doctor.firstName} ${r.doctor.lastName}`,
                  },
                  {
                    key: "type",
                    header: "Tipo",
                    render: (r) => translateChoiceLabel(r.prescriptionType),
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
                      canCancel &&
                      !["DISPENSED", "CANCELLED"].includes(r.status) ? (
                        <button
                          className="row-action row-action--danger"
                          onClick={() => {
                            setSelected(r);
                            setModal("cancel");
                          }}
                        >
                          Cancelar
                        </button>
                      ) : (
                        <span>—</span>
                      ),
                  },
                ]}
              />
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon">
                  <FileText size={27} />
                </span>
                <strong>Sin recetas</strong>
                <p>Registra la primera receta.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
      <PrescriptionForm
        mode={modal}
        patients={patients}
        doctors={doctors}
        products={products}
        todayDate={todayDate}
        busy={busy}
        error={actionError}
        onClose={close}
        onSubmit={submit}
      />
    </div>
  );
};
