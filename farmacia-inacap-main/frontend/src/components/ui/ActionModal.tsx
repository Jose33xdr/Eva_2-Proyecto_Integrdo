import { ChevronDown, CircleQuestionMark, Plus, Search, X } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { translateChoiceLabel } from "../../lib/choiceLabels";
import {
  RUT_EXAMPLE,
  isFieldRequired,
  isFieldVisible,
  isRutFieldName,
  validateField,
  validateFields,
  type FormValuesMap,
} from "../../lib/formValidation";
import "./ui.module.css";

export type ActionFieldOption = {
  value: string;
  label: string;
};

export type ActionField = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "password" | "select" | "textarea" | "checkbox";
  /** Texto gris dentro del campo. Si no se indica y hay `example`, se usa "Ej.: …". */
  placeholder?: string;
  /** Instrucción breve que siempre se ve bajo el campo. */
  hint?: string;
  /** Explicación ampliada que se abre con el botón "Ayuda": qué dato es, dónde encontrarlo y cómo escribirlo. */
  help?: string;
  /** Ejemplo orientativo. Solo se muestra como guía: nunca se guarda. */
  example?: string;
  required?: boolean;
  /** Obligatorio solo en ciertos casos, según los otros valores del formulario. */
  requiredIf?: (values: FormValuesMap) => boolean;
  min?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  /** Exige un número entero (sin decimales). */
  integer?: boolean;
  options?: ActionFieldOption[];
  /** Significado de cada opción de la lista, en palabras sencillas. */
  optionHelp?: Record<string, string>;
  /** Texto de la primera opción vacía de una lista. */
  emptyOptionLabel?: string;
  /** Mensaje si la lista no tiene opciones todavía. */
  emptyOptionsHint?: string;
  /** Botón para crear un elemento que falta en la lista sin salir del formulario. */
  addOption?: { label: string; onClick: () => void };
  disabled?: boolean;
  /** Ubica el campo dentro de la sección opcional "Más detalles". */
  advanced?: boolean;
  /** Título de apartado que se muestra antes del primer campo visible del grupo. */
  group?: string;
  groupDescription?: string;
  /** Muestra el campo solo cuando corresponde según los otros valores. */
  showIf?: (values: FormValuesMap) => boolean;
};

const formatRut = (value: string, finalize = false) => {
  const cleaned = value.toUpperCase().replace(/[^0-9K]/g, "");
  const digits = cleaned.replace(/K/g, "");
  const rut = `${digits}${cleaned.includes("K") ? "K" : ""}`.slice(0, 9);

  if (rut.length >= 7 || (finalize && rut.length >= 2)) {
    return `${rut.slice(0, -1)}-${rut.slice(-1)}`;
  }

  return rut;
};

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const SEARCHABLE_OPTIONS_THRESHOLD = 8;

type Props = {
  open: boolean;
  title: string;
  description?: string;
  fields: ActionField[];
  initialValues?: Record<string, unknown>;
  confirmLabel?: string;
  busy?: boolean;
  error?: string;
  /** Título de la sección opcional. */
  advancedTitle?: string;
  advancedDescription?: string;
  /** Abre "Más detalles" al iniciar (útil al editar datos que ya existen). */
  advancedOpenByDefault?: boolean;
  /** Valores que la página aplica sin borrar lo ya escrito (ej.: elegir una categoría recién creada). */
  fieldPatch?: { nonce: number; values: FormValuesMap };
  onClose: () => void;
  onSubmit: (values: Record<string, string | number | boolean>) => void | Promise<void>;
};

const normalizeInitial = (
  fields: ActionField[],
  initialValues?: Props["initialValues"],
) => {
  const result: FormValuesMap = {};

  fields.forEach((field) => {
    const value = initialValues?.[field.name];

    if (field.type === "checkbox") {
      result[field.name] = Boolean(value);
    } else if (field.type === "number") {
      result[field.name] =
        value === null || value === undefined || value === "" ? "" : Number(value);
    } else if (field.type === "date") {
      const stringValue = value === null || value === undefined ? "" : String(value);
      result[field.name] = stringValue ? stringValue.slice(0, 10) : "";
    } else {
      const stringValue = value === null || value === undefined ? "" : String(value);
      result[field.name] =
        isRutFieldName(field.name) && field.type !== "select"
          ? formatRut(stringValue, true)
          : stringValue;
    }
  });

  return result;
};

const ActionModalDialog = ({
  title,
  description,
  fields,
  initialValues,
  confirmLabel = "Guardar",
  busy = false,
  error,
  advancedTitle = "Más detalles (opcional)",
  advancedDescription = "Datos que no siempre tendrás a mano. Puedes dejarlos vacíos y completarlos después.",
  advancedOpenByDefault = false,
  fieldPatch,
  onClose,
  onSubmit,
}: Omit<Props, "open">) => {
  const uid = useId();
  const [initialSnapshot] = useState(() => normalizeInitial(fields, initialValues));
  const [values, setValues] = useState<FormValuesMap>(initialSnapshot);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openHelp, setOpenHelp] = useState<Record<string, boolean>>({});
  const [searches, setSearches] = useState<Record<string, string>>({});
  const [advancedOpen, setAdvancedOpen] = useState(advancedOpenByDefault);
  const [appliedPatch, setAppliedPatch] = useState(fieldPatch?.nonce ?? 0);

  // Aplica valores enviados por la página (por ejemplo, una categoría recién creada).
  if (fieldPatch && fieldPatch.nonce !== appliedPatch) {
    setAppliedPatch(fieldPatch.nonce);
    setValues((current) => ({ ...current, ...fieldPatch.values }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(fieldPatch.values).forEach((key) => delete next[key]);
      return next;
    });
  }

  const fieldId = (name: string) => `${uid}-${name}`;
  const visibleFields = fields.filter((field) => isFieldVisible(field, values));
  const essentialFields = visibleFields.filter((field) => !field.advanced);
  const advancedFields = visibleFields.filter((field) => field.advanced);
  const hasRequired = visibleFields.some(
    (field) => isFieldRequired(field, values) && field.type !== "checkbox",
  );
  const errorCount = Object.keys(errors).length;
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialSnapshot);

  const clearError = (name: string) => {
    if (!errors[name]) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const setValue = (field: ActionField, value: string | number | boolean) => {
    setValues((current) => ({ ...current, [field.name]: value }));
    clearError(field.name);
  };

  const showErrorIfInvalid = (field: ActionField, nextValues: FormValuesMap) => {
    // Al salir de un campo ya completado, avisa de inmediato si el formato no es válido.
    if (String(nextValues[field.name] ?? "").trim() === "") return;
    const message = validateField(field, nextValues);
    if (message) setErrors((current) => ({ ...current, [field.name]: message }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateFields(fields, values);
    setErrors(nextErrors);

    const firstInvalid = visibleFields.find((field) => nextErrors[field.name]);
    if (firstInvalid) {
      if (firstInvalid.advanced) setAdvancedOpen(true);
      window.setTimeout(() => {
        document.getElementById(fieldId(firstInvalid.name))?.focus();
      }, 0);
      return;
    }

    void onSubmit(values);
  };

  const toggleHelp = (name: string) =>
    setOpenHelp((current) => ({ ...current, [name]: !current[name] }));

  const renderHelpButton = (field: ActionField, helpId: string, hasHelp: boolean) =>
    hasHelp ? (
      <button
        type="button"
        className={`action-field__help-toggle${openHelp[field.name] ? " is-open" : ""}`}
        aria-expanded={Boolean(openHelp[field.name])}
        aria-controls={helpId}
        aria-label={`Ayuda sobre «${field.label}»`}
        title="¿Qué debo poner aquí?"
        onClick={() => toggleHelp(field.name)}
      >
        <CircleQuestionMark size={15} aria-hidden="true" />
        <span>Ayuda</span>
      </button>
    ) : null;

  const renderHelpPanel = (field: ActionField, helpId: string) => {
    if (!openHelp[field.name]) return null;
    const optionEntries = field.optionHelp
      ? (field.options ?? []).filter((option) => field.optionHelp?.[option.value])
      : [];
    return (
      <div className="action-field__help" id={helpId}>
        {field.help ? <p>{field.help}</p> : null}
        {optionEntries.length ? (
          <>
            <p className="action-field__help-title">Qué significa cada opción:</p>
            <dl>
              {optionEntries.map((option) => (
                <div key={option.value}>
                  <dt>{translateChoiceLabel(option.label)}</dt>
                  <dd>{field.optionHelp?.[option.value]}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
      </div>
    );
  };

  const renderField = (field: ActionField) => {
    const value = values[field.name];
    const id = fieldId(field.name);
    const hintId = `${id}-hint`;
    const helpId = `${id}-help`;
    const errorId = `${id}-error`;
    const fieldError = errors[field.name];
    const hasHelp = Boolean(field.help || field.optionHelp);
    const describedBy = [fieldError ? errorId : "", hintId, openHelp[field.name] ? helpId : ""]
      .filter(Boolean)
      .join(" ");

    const errorNode = fieldError ? (
      <span className="action-field__error" id={errorId}>
        {fieldError}
      </span>
    ) : null;

    if (field.type === "checkbox") {
      return (
        <div
          className={`action-field action-field--checkbox${value ? " is-checked" : ""}`}
          key={field.name}
        >
          <div className="action-field__checkrow">
            <input
              id={id}
              type="checkbox"
              checked={Boolean(value)}
              disabled={field.disabled}
              aria-describedby={describedBy}
              onChange={(event) => setValue(field, event.target.checked)}
            />
            <label htmlFor={id}>{field.label}</label>
            {renderHelpButton(field, helpId, hasHelp)}
          </div>
          <span className="action-field__hint" id={hintId}>
            {field.hint ?? "Marca la casilla solo si corresponde."}
          </span>
          {renderHelpPanel(field, helpId)}
          {errorNode}
        </div>
      );
    }

    const rutField = isRutFieldName(field.name) && field.type !== "select";
    const example = field.example ?? (rutField ? RUT_EXAMPLE : undefined);
    const hint =
      field.hint ??
      (rutField ? "Escríbelo sin puntos. El guion antes del último dígito se agrega solo." : undefined);
    const allowNegativeAdjustment = field.name === "amount" && values.type === "ADJUSTMENT";
    const lengthInfo =
      field.minLength && field.maxLength
        ? `${field.minLength} a ${field.maxLength} car.`
        : field.maxLength
          ? `máx. ${field.maxLength} car.`
          : field.minLength
            ? `mín. ${field.minLength} car.`
            : "";
    const placeholder =
      field.placeholder ??
      (example
        ? `Ej.: ${example}${lengthInfo ? ` (${lengthInfo})` : ""}`
        : lengthInfo
          ? `Ingresa datos (${lengthInfo})`
          : undefined);
    const isWide = field.type === "textarea";

    let control: ReactNode;
    let extra: ReactNode = null;

    if (field.type === "textarea") {
      control = (
        <textarea
          id={id}
          value={String(value ?? "")}
          placeholder={placeholder}
          disabled={field.disabled}
          maxLength={field.maxLength}
          aria-invalid={Boolean(fieldError)}
          aria-required={isFieldRequired(field, values)}
          aria-describedby={describedBy}
          onChange={(event) => setValue(field, event.target.value)}
        />
      );
    } else if (field.type === "select") {
      const options = field.options ?? [];
      const currentValue = String(value ?? "");
      const search = searches[field.name] ?? "";
      const searchable = options.length > SEARCHABLE_OPTIONS_THRESHOLD;
      const query = normalizeText(search.trim());
      const filteredOptions = query
        ? options.filter(
            (option) =>
              option.value === currentValue ||
              normalizeText(translateChoiceLabel(option.label)).includes(query),
          )
        : options;
      const selectedHelp = field.optionHelp?.[currentValue];
      const noMatches =
        Boolean(query) && !filteredOptions.some((option) => option.value !== currentValue);

      control = (
        <>
          {searchable ? (
            <span className="action-field__search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                value={search}
                placeholder="Escribe aquí para buscar en la lista…"
                aria-label={`Buscar en «${field.label}»`}
                disabled={field.disabled}
                onChange={(event) =>
                  setSearches((current) => ({ ...current, [field.name]: event.target.value }))
                }
              />
            </span>
          ) : null}
          <select
            id={id}
            value={currentValue}
            disabled={field.disabled}
            aria-invalid={Boolean(fieldError)}
            aria-required={isFieldRequired(field, values)}
            aria-describedby={describedBy}
            onChange={(event) => setValue(field, event.target.value)}
          >
            <option value="">
              {field.emptyOptionLabel ??
                (isFieldRequired(field, values) ? "Elige una opción…" : "Ninguno / no aplica")}
            </option>
            {filteredOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {translateChoiceLabel(option.label)}
              </option>
            ))}
          </select>
        </>
      );

      extra = (
        <>
          {searchable && query && !noMatches ? (
            <span className="action-field__note">
              Mostrando {filteredOptions.length} de {options.length} opciones. Abre la lista para elegir.
            </span>
          ) : null}
          {noMatches ? (
            <span className="action-field__note">
              No encontramos «{search.trim()}» en la lista. Revisa cómo está escrito o borra la búsqueda.
            </span>
          ) : null}
          {!options.length ? (
            <span className="action-field__note">
              {field.emptyOptionsHint ?? "Todavía no hay opciones registradas en esta lista."}
            </span>
          ) : null}
          {selectedHelp ? (
            <span className="action-field__selected-help">{selectedHelp}</span>
          ) : null}
          {field.addOption && !field.disabled ? (
            <button type="button" className="action-field__add" onClick={field.addOption.onClick}>
              <Plus size={15} aria-hidden="true" />
              {field.addOption.label}
            </button>
          ) : null}
        </>
      );
    } else {
      control = (
        <input
          id={id}
          type={field.type ?? "text"}
          inputMode={rutField ? "text" : field.type === "number" ? "decimal" : undefined}
          value={String(value ?? "")}
          placeholder={placeholder}
          disabled={field.disabled}
          min={allowNegativeAdjustment ? undefined : field.min}
          step={field.step ?? (field.integer ? 1 : field.type === "number" ? "any" : undefined)}
          maxLength={rutField ? 10 : field.maxLength}
          autoComplete={
            field.type === "password" ? "new-password" : rutField ? "off" : undefined
          }
          aria-invalid={Boolean(fieldError)}
          aria-required={isFieldRequired(field, values)}
          aria-describedby={describedBy}
          onBlur={() => {
            if (rutField) {
              const formatted = formatRut(String(values[field.name] ?? ""), true);
              setValue(field, formatted);
              showErrorIfInvalid(field, { ...values, [field.name]: formatted });
            } else {
              showErrorIfInvalid(field, values);
            }
          }}
          onChange={(event) =>
            setValue(
              field,
              rutField
                ? formatRut(event.target.value)
                : field.type === "number"
                  ? event.target.value === ""
                    ? ""
                    : Number(event.target.value)
                  : event.target.value,
            )
          }
        />
      );
    }

    return (
      <div
        className={`action-field${isWide ? " action-field--wide" : ""}${fieldError ? " has-error" : ""}`}
        key={field.name}
      >
        <div className="action-field__top">
          <label className="action-field__label" htmlFor={id}>
            {field.label}
            {isFieldRequired(field, values) ? (
              <span className="action-field__required" title="Obligatorio">
                {" "}*<span className="action-field__sr"> (obligatorio)</span>
              </span>
            ) : (
              <span className="action-field__optional">opcional</span>
            )}
          </label>
          {renderHelpButton(field, helpId, hasHelp)}
        </div>
        {control}
        {hint || example || field.maxLength || field.minLength ? (
          <span className="action-field__hint" id={hintId}>
            {hint}
            {example ? (
              <span className="action-field__example">
                {hint ? " " : ""}Ejemplo (solo de guía): {example}
              </span>
            ) : null}
            {field.maxLength || field.minLength ? (
              <span className="action-field__length" style={{ display: "block", marginTop: "3px", color: "#64748b", fontWeight: 500 }}>
                📏 Largo permitido: {field.minLength && field.maxLength
                  ? `entre ${field.minLength} y ${field.maxLength} caracteres.`
                  : field.maxLength
                    ? `máximo ${field.maxLength} caracteres.`
                    : `mínimo ${field.minLength} caracteres.`}
              </span>
            ) : null}
          </span>
        ) : null}
        {extra}
        {renderHelpPanel(field, helpId)}
        {errorNode}
      </div>
    );
  };

  const renderList = (list: ActionField[]) => {
    let lastGroup: string | undefined;
    const nodes: ReactNode[] = [];
    list.forEach((field) => {
      if (field.group && field.group !== lastGroup) {
        nodes.push(
          <div className="action-group" key={`group-${field.group}`}>
            <h3>{field.group}</h3>
            {field.groupDescription ? <p>{field.groupDescription}</p> : null}
          </div>,
        );
      }
      lastGroup = field.group;
      nodes.push(renderField(field));
    });
    return nodes;
  };

  const advancedErrors = advancedFields.filter((field) => errors[field.name]).length;

  return (
    <div
      className="action-modal__backdrop"
      role="presentation"
      onMouseDown={() => {
        // Evita perder lo escrito por un clic accidental fuera de la ventana.
        if (!isDirty) onClose();
      }}
    >
      <section
        className="action-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="action-modal__header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar sin guardar" title="Cerrar sin guardar">
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className="action-modal__body">
            {hasRequired ? (
              <p className="action-modal__legend">
                Los campos con <strong>*</strong> son obligatorios. Los que dicen «opcional» puedes
                dejarlos vacíos. Los ejemplos en gris son solo una guía: no se guardan.
              </p>
            ) : null}

            {renderList(essentialFields)}

            {advancedFields.length ? (
              <details
                className="action-more"
                open={advancedOpen}
                onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
              >
                <summary>
                  <ChevronDown size={17} className="action-more__chevron" aria-hidden="true" />
                  <span className="action-more__text">
                    <strong>{advancedTitle}</strong>
                    <small>{advancedDescription}</small>
                  </span>
                  {advancedErrors ? (
                    <span className="action-more__badge">
                      {advancedErrors === 1
                        ? "1 dato por revisar"
                        : `${advancedErrors} datos por revisar`}
                    </span>
                  ) : null}
                </summary>
                <div className="action-more__body">{renderList(advancedFields)}</div>
              </details>
            ) : null}

            {errorCount ? (
              <div className="alert alert--error action-modal__alert" role="alert">
                {errorCount === 1
                  ? "Falta corregir 1 dato. Está marcado en rojo, con la explicación de cómo resolverlo."
                  : `Faltan corregir ${errorCount} datos. Están marcados en rojo, con la explicación de cómo resolverlos.`}
              </div>
            ) : null}
            {error ? (
              <div className="alert alert--error action-modal__alert" role="alert">
                {error}
              </div>
            ) : null}
          </div>

          <footer className="action-modal__footer">
            <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </button>
            <button type="submit" className="button button--primary" disabled={busy}>
              {busy ? "Guardando..." : confirmLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
};

export const ActionModal = (props: Props) => {
  if (!props.open) return null;

  const entityKey = String(
    props.initialValues?.id ??
      props.initialValues?.key ??
      props.initialValues?.code ??
      "new",
  );

  return <ActionModalDialog key={`${props.title}:${entityKey}`} {...props} />;
};
