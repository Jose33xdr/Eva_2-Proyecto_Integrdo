import { KeyRound, Plus, RefreshCcw, Search, UsersRound } from "lucide-react";
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
import { translateChoiceLabel } from "../lib/choiceLabels";

type Role = { id: string; code: string; name: string; isActive?: boolean };
type User = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone?: string | null;
  username: string;
  status: string;
  role: Role;
};
type FormValues = Record<string, string | number | boolean>;

const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const defaultUserInitialValues = { status: "ACTIVE" };

export const UsersPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("users.create");
  const canUpdate = hasPermission("users.update");
  const canDelete = hasPermission("users.delete");

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const userSel = useCallback((p: { items: User[] }) => p.items, []);
  const roleSel = useCallback((p: { roles: Role[] }) => p.roles, []);

  const usersRes = useResource<User[], { items: User[] }>(
    "/users?limit=100",
    userSel,
  );
  const rolesRes = useResource<Role[], { roles: Role[] }>(
    "/access/roles",
    roleSel,
  );

  const rows = useMemo(() => usersRes.data ?? [], [usersRes.data]);
  const roles = useMemo(() => rolesRes.data ?? [], [rolesRes.data]);
  const activeRoles = useMemo(
    () => roles.filter((r) => r.isActive !== false),
    [roles],
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !q ||
          norm(
            [
              r.firstName,
              r.lastName,
              r.username,
              r.rut,
              r.email ?? "",
              r.role?.name ?? "",
            ].join(" "),
          ).includes(norm(q)),
      ),
    [rows, q],
  );

  const fields = useMemo<ActionField[]>(
    () => [
      {
        name: "rut",
        label: "RUT de la persona",
        required: true,
        group: "Datos de la persona",
        help: "Es el RUT de quien usará la cuenta. Lo encuentras en su cédula de identidad o en su contrato.",
      },
      {
        name: "firstName",
        label: "Nombres",
        required: true,
        minLength: 2,
        maxLength: 100,
        group: "Datos de la persona",
        example: "Camila",
      },
      {
        name: "lastName",
        label: "Apellidos",
        required: true,
        minLength: 2,
        maxLength: 100,
        group: "Datos de la persona",
        example: "Rojas Fuentes",
      },
      {
        name: "username",
        label: "Nombre de usuario",
        required: true,
        minLength: 3,
        maxLength: 80,
        group: "Acceso al sistema",
        groupDescription: "Con estos datos la persona entrará a FarmaGestión.",
        example: "crojas",
        hint: "Lo escribirá para iniciar sesión. Al menos 3 caracteres, sin espacios.",
      },
      {
        name: "password",
        label: editing ? "Nueva contraseña" : "Contraseña",
        type: "password",
        required: !editing,
        minLength: 8,
        group: "Acceso al sistema",
        placeholder: editing ? "Déjala vacía para no cambiarla" : "Mínimo 8 caracteres",
        hint: editing
          ? "Solo escríbela si quieres cambiarla. Si la dejas vacía, se mantiene la contraseña actual."
          : "Mínimo 8 caracteres. Entrégasela a la persona de forma privada y pídele que no la comparta.",
      },
      {
        name: "roleId",
        label: "Rol (qué puede hacer)",
        type: "select",
        required: true,
        group: "Acceso al sistema",
        hint: "El rol define qué pantallas y acciones puede usar la persona.",
        help: "Elige el rol que corresponde a su trabajo en la farmacia. Si no sabes cuál asignar, pregúntale a quien administra la farmacia: un rol con más permisos de los necesarios permite hacer cambios sensibles.",
        emptyOptionsHint: "No hay roles activos disponibles.",
        options: activeRoles.map((r) => ({ value: r.id, label: r.name })),
      },
      {
        name: "status",
        label: "Estado de la cuenta",
        type: "select",
        required: true,
        group: "Acceso al sistema",
        hint: "Para una persona nueva que empieza a trabajar, elige «Activo».",
        optionHelp: {
          ACTIVE: "Activo: puede iniciar sesión y trabajar con normalidad.",
          INACTIVE: "Inactivo: no puede iniciar sesión. Úsalo cuando la persona deja de trabajar en la farmacia.",
          BLOCKED: "Bloqueado: acceso suspendido, por ejemplo por un problema de seguridad. Un administrador debe reactivarlo.",
        },
        options: ["ACTIVE", "INACTIVE", "BLOCKED"].map((v) => ({
          value: v,
          label: translateChoiceLabel(v),
        })),
      },
      {
        name: "email",
        label: "Correo electrónico",
        type: "email",
        maxLength: 150,
        advanced: true,
        example: "nombre@correo.cl",
        hint: "Correo de contacto de la persona.",
      },
      {
        name: "phone",
        label: "Teléfono",
        maxLength: 30,
        advanced: true,
        example: "+56 9 1234 5678",
      },
    ],
    [editing, activeRoles],
  );

  const close = () => {
    setOpen(false);
    setEditing(null);
    setActionError("");
  };

  const save = async (v: FormValues) => {
    const payload: Record<string, unknown> = {
      rut: String(v.rut),
      firstName: String(v.firstName),
      lastName: String(v.lastName),
      email: nullable(v.email),
      phone: nullable(v.phone),
      username: String(v.username),
      roleId: String(v.roleId),
      status: String(v.status || "ACTIVE"),
    };
    if (String(v.password ?? "").trim()) {
      payload.password = String(v.password);
    }
    await runApiAction(
      () =>
        editing
          ? api.patch(`/users/${editing.id}`, payload)
          : api.post("/users", payload),
      setBusy,
      setActionError,
      async () => {
        await usersRes.reload();
        close();
      },
      editing
        ? `Listo: se guardaron los cambios de ${String(payload.firstName)} ${String(payload.lastName)}.`
        : `Listo: se creó la cuenta de ${String(payload.firstName)} ${String(payload.lastName)}.`,
    );
  };

  const remove = async (r: User) => {
    if (!confirm(`¿Eliminar o desactivar a ${r.firstName} ${r.lastName}?`)) {
      return;
    }
    try {
      await api.delete(`/users/${r.id}`);
      await usersRes.reload();
    } catch (error: unknown) {
      setActionError(getApiErrorMessage(error));
    }
  };

  const initialValues = useMemo<Record<string, unknown>>(
    () =>
      editing
        ? { ...editing, roleId: editing.role?.id, password: "" }
        : defaultUserInitialValues,
    [editing],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Gestiona cuentas, roles y accesos del sistema."
        actions={
          <div className="module-toolbar-actions">
            <button
              className="button button--secondary"
              onClick={() => void usersRes.reload()}
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
                Nuevo usuario
              </button>
            ) : null}
          </div>
        }
      />
      {usersRes.loading ? <PageLoader /> : null}
      {usersRes.error || rolesRes.error || actionError ? (
        <div className="alert alert--error">
          {usersRes.error || rolesRes.error || actionError}
        </div>
      ) : null}
      {!usersRes.loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <UsersRound size={19} />
              </span>
              <div>
                <span>Usuarios</span>
                <strong>{rows.length}</strong>
                <small>Cuentas</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <UsersRound size={19} />
              </span>
              <div>
                <span>Activos</span>
                <strong>
                  {rows.filter((r) => r.status === "ACTIVE").length}
                </strong>
                <small>Habilitados</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <KeyRound size={19} />
              </span>
              <div>
                <span>Roles</span>
                <strong>{activeRoles.length}</strong>
                <small>Perfiles</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <UsersRound size={19} />
              </span>
              <div>
                <span>Bloqueados</span>
                <strong>
                  {rows.filter((r) => r.status === "BLOCKED").length}
                </strong>
                <small>Sin acceso</small>
              </div>
            </article>
          </section>
          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Accesos</span>
                <h2>Usuarios del sistema</h2>
              </div>
              <label className="module-search">
                <Search size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nombre, usuario, RUT..."
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
                    header: "Usuario",
                    render: (r) => (
                      <div className="cell-stack">
                        <strong>
                          {r.firstName} {r.lastName}
                        </strong>
                        <span>@{r.username}</span>
                      </div>
                    ),
                  },
                  { key: "rut", header: "RUT", render: (r) => r.rut },
                  {
                    key: "role",
                    header: "Rol",
                    render: (r) => r.role?.name ?? "—",
                  },
                  {
                    key: "email",
                    header: "Correo",
                    render: (r) => r.email ?? "—",
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
                <strong>Sin usuarios</strong>
                <p>No hay usuarios registrados.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
      <ActionModal
        open={open}
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        description={
          editing
            ? "Estos son los datos actuales. Cambia solo lo que necesites; la contraseña solo cambia si escribes una nueva."
            : "Crea la cuenta de una persona del equipo para que pueda entrar al sistema."
        }
        confirmLabel={editing ? "Guardar cambios" : "Crear usuario"}
        advancedTitle="Datos de contacto (opcional)"
        advancedDescription="Correo y teléfono de la persona."
        advancedOpenByDefault={Boolean(editing)}
        fields={fields}
        initialValues={initialValues}
        busy={busy}
        error={actionError}
        onClose={close}
        onSubmit={save}
      />
    </div>
  );
};
