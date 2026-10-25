import { Eye, EyeOff, Plus, RefreshCcw, Search, Settings2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ActionModal, type ActionField } from "../components/ui/ActionModal";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { api } from "../lib/api";
import { nullable, runApiAction } from "../lib/actionHelpers";

type Setting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isPublic: boolean;
};
type FormValues = Record<string, string | number | boolean>;

const norm = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const defaultSettingInitialValues = { isPublic: false };

export const SettingsPage = () => {
  const { hasPermission } = useAuth();
  const canUpdate =
    hasPermission("settings.update") || hasPermission("settings.manage");

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Setting | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const selector = useCallback(
    (p: { settings: Setting[] }) => p.settings,
    [],
  );
  const res = useResource<Setting[], { settings: Setting[] }>(
    "/settings",
    selector,
  );
  const rows = useMemo(() => res.data ?? [], [res.data]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !q ||
          norm([r.key, r.value, r.description ?? ""].join(" ")).includes(
            norm(q),
          ),
      ),
    [rows, q],
  );

  const fields = useMemo<ActionField[]>(
    () => [
      {
        name: "key",
        label: "Nombre interno del parámetro (clave)",
        required: true,
        minLength: 2,
        maxLength: 120,
        disabled: Boolean(editing),
        example: "pharmacy.name",
        hint: editing
          ? "La clave no se puede cambiar. Si necesitas otra, crea un parámetro nuevo."
          : "Identificador técnico, sin espacios. Debe coincidir con el que espera el sistema.",
        help: "Es el nombre con que el sistema reconoce este ajuste. Si escribes una clave que ya existe, se reemplaza su valor. Si no sabes qué clave usar, consúltalo con el administrador del sistema antes de crearla: una clave mal escrita no tendrá efecto.",
      },
      {
        name: "value",
        label: "Valor",
        required: true,
        example: "Farmacia Central",
        hint: "El dato que tomará este parámetro. Escríbelo exactamente como debe usarse.",
      },
      {
        name: "description",
        label: "Descripción",
        type: "textarea",
        maxLength: 255,
        example: "Nombre de la farmacia que aparece en boletas y reportes",
        hint: "Explica para qué sirve, para que otras personas lo entiendan.",
      },
      {
        name: "isPublic",
        label: "Visible sin iniciar sesión",
        type: "checkbox",
        hint: "Al marcarla, cualquier persona puede leer este valor sin entrar al sistema (por ejemplo, el nombre de la farmacia en la pantalla de ingreso).",
        help: "No la marques para datos internos o sensibles, como montos, correos o configuraciones de seguridad. Si tienes dudas, déjala sin marcar.",
      },
    ],
    [editing],
  );

  const close = () => {
    setOpen(false);
    setEditing(null);
    setActionError("");
  };

  const save = async (v: FormValues) => {
    await runApiAction(
      () =>
        api.put("/settings", {
          key: String(v.key),
          value: String(v.value),
          description: nullable(v.description),
          isPublic: Boolean(v.isPublic),
        }),
      setBusy,
      setActionError,
      async () => {
        await res.reload();
        close();
      },
      `Listo: se guardó el parámetro «${String(v.key)}».`,
    );
  };

  const initialValues = useMemo(
    () => editing ?? defaultSettingInitialValues,
    [editing],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Sistema"
        title="Configuración"
        description="Parámetros generales de la farmacia y del sistema."
        actions={
          <div className="module-toolbar-actions">
            <button
              className="button button--secondary"
              onClick={() => void res.reload()}
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>
            {canUpdate ? (
              <button
                className="button button--primary"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus size={17} />
                Nuevo parámetro
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
                <Settings2 size={19} />
              </span>
              <div>
                <span>Parámetros</span>
                <strong>{rows.length}</strong>
                <small>Configurados</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Eye size={19} />
              </span>
              <div>
                <span>Públicos</span>
                <strong>{rows.filter((r) => r.isPublic).length}</strong>
                <small>Visibles</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <EyeOff size={19} />
              </span>
              <div>
                <span>Internos</span>
                <strong>{rows.filter((r) => !r.isPublic).length}</strong>
                <small>Restringidos</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <Settings2 size={19} />
              </span>
              <div>
                <span>Estado</span>
                <strong>OK</strong>
                <small>Configuración cargada</small>
              </div>
            </article>
          </section>
          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Parámetros</span>
                <h2>Configuración general</h2>
              </div>
              <label className="module-search">
                <Search size={16} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar configuración..."
                />
              </label>
            </div>
            {filtered.length ? (
              <div className="settings-list">
                {filtered.map((r) => (
                  <article className="settings-row" key={r.id}>
                    <div className="settings-row__icon">
                      {r.isPublic ? <Eye size={18} /> : <EyeOff size={18} />}
                    </div>
                    <div className="settings-row__main">
                      <div className="settings-row__heading">
                        <div>
                          <span className="settings-row__group">Sistema</span>
                          <strong>{r.key}</strong>
                        </div>
                        <div className="row-actions">
                          <span
                            className={`settings-visibility ${
                              r.isPublic
                                ? "settings-visibility--public"
                                : "settings-visibility--internal"
                            }`}
                          >
                            {r.isPublic ? "Público" : "Interno"}
                          </span>
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
                        </div>
                      </div>
                      <div className="settings-row__value">
                        <span>Valor</span>
                        <strong>{r.value}</strong>
                      </div>
                      <p>{r.description ?? "Sin descripción"}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon">
                  <Settings2 size={27} />
                </span>
                <strong>Sin configuraciones</strong>
                <p>Crea el primer parámetro.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
      <ActionModal
        open={open}
        title={editing ? "Editar parámetro" : "Nuevo parámetro"}
        description={
          editing
            ? "Este es el valor actual. Cambia solo lo que necesites y guarda."
            : "Los parámetros cambian el comportamiento general del sistema. Créalos solo si sabes qué clave necesitas."
        }
        confirmLabel={editing ? "Guardar cambios" : "Crear parámetro"}
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
