export type FormValue = string | number | boolean;
export type FormValuesMap = Record<string, FormValue>;

/** Datos mínimos de un campo que necesita la validación del formulario. */
export type ValidatableField = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  /** Obligatorio solo en ciertos casos (por ejemplo, datos de factura). */
  requiredIf?: (values: FormValuesMap) => boolean;
  min?: number;
  minLength?: number;
  integer?: boolean;
  example?: string;
  disabled?: boolean;
  showIf?: (values: FormValuesMap) => boolean;
};

export const RUT_EXAMPLE = "12345678-5";

export const isRutFieldName = (name: string) => name.toLowerCase().endsWith("rut");

/** Misma regla de dígito verificador que usa el servidor (backend/src/utils/rut.ts). */
export const isValidRut = (rut: string) => {
  const clean = rut.replace(/\./g, "").replace(/-/g, "").trim().toUpperCase();
  if (clean.length < 7 || clean.length > 9) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body.charAt(i)) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expected = 11 - (sum % 11);
  const expectedDv = expected === 11 ? "0" : expected === 10 ? "K" : String(expected);
  return dv === expectedDv;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isFieldRequired = (field: ValidatableField, values: FormValuesMap) =>
  Boolean(field.required || field.requiredIf?.(values));

export const isFieldVisible = (field: ValidatableField, values: FormValuesMap) =>
  field.showIf ? field.showIf(values) : true;

const withExample = (message: string, example?: string) =>
  example ? `${message} Ejemplo: ${example}.` : message;

/** Devuelve un mensaje claro en español o null si el campo está correcto. */
export const validateField = (
  field: ValidatableField,
  values: FormValuesMap,
): string | null => {
  if (field.disabled || field.type === "checkbox" || !isFieldVisible(field, values)) {
    return null;
  }

  const raw = values[field.name];
  const text = String(raw ?? "").trim();
  const label = `«${field.label}»`;

  if (!text) {
    if (!isFieldRequired(field, values)) return null;
    if (field.type === "select") {
      return `Falta elegir ${label}. Abre la lista y selecciona una opción.`;
    }
    if (field.type === "date") {
      return `Falta completar ${label}. Elige el día en el calendario.`;
    }
    return withExample(`Falta completar ${label}.`, field.example);
  }

  if (field.type === "number") {
    const number = Number(raw);
    if (!Number.isFinite(number)) {
      return withExample(`${label} debe ser un número, sin letras ni símbolos.`, field.example);
    }
    if (field.integer && !Number.isInteger(number)) {
      return withExample(`${label} debe ser un número entero, sin decimales.`, field.example);
    }
    if (field.min !== undefined && number < field.min) {
      return `${label} no puede ser menor que ${field.min}.`;
    }
    return null;
  }

  if (field.type === "email" && !EMAIL_PATTERN.test(text)) {
    return `${label} no tiene formato de correo. Revisa que tenga @ y un dominio. Ejemplo: nombre@correo.cl.`;
  }

  if (field.type !== "select" && isRutFieldName(field.name) && !isValidRut(text)) {
    return `${label} no es un RUT válido. Escríbelo sin puntos y con guion, y revisa el dígito final. Ejemplo: ${RUT_EXAMPLE}.`;
  }

  if (field.minLength && text.length < field.minLength) {
    return withExample(
      `${label} es muy corto: debe tener al menos ${field.minLength} caracteres.`,
      field.example,
    );
  }

  return null;
};

export const validateFields = (fields: ValidatableField[], values: FormValuesMap) => {
  const errors: Record<string, string> = {};
  fields.forEach((field) => {
    const message = validateField(field, values);
    if (message) errors[field.name] = message;
  });
  return errors;
};
