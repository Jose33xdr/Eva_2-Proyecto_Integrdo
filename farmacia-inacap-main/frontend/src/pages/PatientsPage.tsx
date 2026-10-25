import { Plus, RefreshCcw, Search, UsersRound } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ActionModal, type ActionField } from "../components/ui/ActionModal";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { api, getApiErrorMessage } from "../lib/api";
import { nullable, runApiAction } from "../lib/actionHelpers";

type Patient = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  birthDate?: string | null;
  phone: string | null;
  email: string | null;
  address?: string | null;
  isActive: boolean;
  _count?: { prescriptions: number; sales: number };
};
type FormValues = Record<string, string | number | boolean>;

const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const patientFields: ActionField[] = [
  {
    name: "rut",
    label: "RUT del paciente",
    required: true,
    help: "Pídelo al paciente o léelo de su cédula de identidad o de la receta. Se usa para encontrarlo rápido en ventas y recetas.",
  },
  {
    name: "firstName",
    label: "Nombres",
    required: true,
    minLength: 2,
    maxLength: 100,
    example: "Juan Carlos",
  },
  {
    name: "lastName",
    label: "Apellidos",
    required: true,
    minLength: 2,
    maxLength: 100,
    example: "Soto Muñoz",
  },
  {
    name: "phone",
    label: "Teléfono",
    maxLength: 30,
    example: "+56 9 1234 5678",
    hint: "Con código de país o solo los 9 dígitos. Máximo 30 caracteres.",
  },
  {
    name: "birthDate",
    label: "Fecha de nacimiento",
    type: "date",
    advanced: true,
    hint: "Elige el día en el calendario. Si el paciente no la entrega, déjala vacía.",
  },
  {
    name: "email",
    label: "Correo electrónico",
    type: "email",
    maxLength: 150,
    advanced: true,
    example: "nombre@correo.cl",
    hint: "Revisa que tenga @ y un dominio, por ejemplo .cl o .com.",
  },
  {
    name: "address",
    label: "Dirección",
    type: "textarea",
    maxLength: 255,
    advanced: true,
    example: "Av. Los Leones 123, depto. 45, Providencia",
    hint: "Calle, número, departamento y comuna.",
  },
  {
    name: "isActive",
    label: "Paciente activo",
    type: "checkbox",
    advanced: true,
    hint: "Si la desmarcas, ya no aparecerá para elegirlo en recetas o ventas nuevas. Su historial se conserva.",
  },
];

const defaultPatientInitialValues = { isActive: true };

export const PatientsPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("patients.create");
  const canUpdate = hasPermission("patients.update");
  const canDelete = hasPermission("patients.delete");

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Patient | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const selector = useCallback(
    (p: { items: Patient[] }) => p.items,
    [],
  );
  const res = useResource<Patient[], { items: Patient[] }>(
    "/patients?limit=100",
    selector,
  );
  const rows = useMemo(() => res.data ?? [], [res.data]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !q ||
          norm(
            [
              r.firstName,
              r.lastName,
              r.rut,
              r.email ?? "",
              r.phone ?? "",
            ].join(" "),
          ).includes(norm(q)),
      ),
    [rows, q],
  );

  const close = () => {
    setOpen(false);
    setEditing(null);
    setActionError("");
  };

  const save = async (v: FormValues) => {
    const payload = {
      rut: String(v.rut),
      firstName: String(v.firstName),
      lastName: String(v.lastName),
      birthDate: nullable(v.birthDate),
      phone: nullable(v.phone),
      email: nullable(v.email),
      address: nullable(v.address),
      isActive: Boolean(v.isActive),
    };
    await runApiAction(
      () =>
        editing
          ? api.patch(`/patients/${editing.id}`, payload)
          : api.post("/patients", payload),
      setBusy,
      setActionError,
      async () => {
        await res.reload();
        close();
      },
      editing
        ? `Listo: se guardaron los cambios de ${payload.firstName} ${payload.lastName}.`
        : `Listo: se registró a ${payload.firstName} ${payload.lastName}.`,
    );
  };

  const remove = async (r: Patient) => {
    if (!confirm(`¿Eliminar o desactivar a ${r.firstName} ${r.lastName}?`)) {
      return;
    }
    try {
      await api.delete(`/patients/${r.id}`);
      await res.reload();
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error));
    }
  };

  const initialValues = useMemo(
    () => editing ?? defaultPatientInitialValues,
    [editing],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Atención clínica"
        title="Pacientes"
        description="Ficha de pacientes, recetas, ventas y coberturas."
        actions={
          <div className="module-toolbar-actions">
            <button
              className="button button--secondary"
              onClick={() => void res.reload()}
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>
            {canCreate ? (
              <button
                className="button button--primary"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus size={17} />
                Nuevo paciente
              </button>
            ) : null}
          </div>
        }
      />
      {res.loading ? <PageLoader /> : null}
      {res.error || actionError ? (
        <div className="alert alert--error">{res.error || actionError}</div>
      ) : null}
      {!res.loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <UsersRound size={19} />
              </span>
              <div>
                <span>Pacientes</span>
                <strong>{rows.length}</strong>
                <small>Registrados</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <UsersRound size={19} />
              </span>
              <div>
                <span>Activos</span>
                <strong>{rows.filter((r) => r.isActive).length}</strong>
                <small>Habilitados</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <UsersRound size={19} />
              </span>
              <div>
                <span>Recetas</span>
                <strong>
                  {rows.reduce((s, r) => s + (r._count?.prescriptions ?? 0), 0)}
                </strong>
                <small>Asociadas</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <UsersRound size={19} />
              </span>
              <div>
                <span>Ventas</span>
                <strong>
                  {rows.reduce((s, r) => s + (r._count?.sales ?? 0), 0)}
                </strong>
                <small>Asociadas</small>
              </div>
            </article>
          </section>
          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Fichas</span>
                <h2>Pacientes registrados</h2>
              </div>
              <label className="module-search">
                <Search size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nombre, RUT, correo..."
                />
              </label>
            </div>
            {filtered.length ? (
              <ResponsiveTable
                rows={filtered}
                getKey={(r) => r.id}
                columns={[
                  {
                    key: "name",
                    header: "Paciente",
                    render: (r) => (
                      <div className="cell-stack">
                        <strong>
                          {r.firstName} {r.lastName}
                        </strong>
                        <span>{r.rut}</span>
                      </div>
                    ),
                  },
                  {
                    key: "phone",
                    header: "Teléfono",
                    render: (r) => r.phone ?? "—",
                  },
                  {
                    key: "email",
                    header: "Correo",
                    render: (r) => r.email ?? "—",
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
                      canUpdate || canDelete ? (
                        <div className="row-actions">
                          {canUpdate ? (
                            <button
                              className="row-action"
                              onClick={() => {
                                setEditing(r);
                                setOpen(true);
                              }}
                            >
                              Editar
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              className="row-action row-action--danger"
                              onClick={() => void remove(r)}
                            >
                              Eliminar
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
                  <UsersRound size={27} />
                </span>
                <strong>Sin pacientes</strong>
                <p>Crea el primer paciente.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
      <ActionModal
        open={open}
        title={editing ? "Editar paciente" : "Nuevo paciente"}
        description={
          editing
            ? "Estos son los datos actuales. Cambia solo lo que necesites; lo demás se mantiene igual."
            : "Con el RUT, los nombres y los apellidos ya puedes registrarlo. Lo demás es opcional."
        }
        confirmLabel={editing ? "Guardar cambios" : "Registrar paciente"}
        advancedTitle="Más detalles (opcional)"
        advancedDescription="Fecha de nacimiento, correo, dirección y estado."
        advancedOpenByDefault={Boolean(editing)}
        fields={patientFields}
        initialValues={initialValues}
        busy={busy}
        error={actionError}
        onClose={close}
        onSubmit={save}
      />
    </div>
  );
};
