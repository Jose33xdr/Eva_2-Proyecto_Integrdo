/** Nombres sencillos de los datos que envían los formularios, para explicar errores del servidor. */
const fieldNames: Record<string, string> = {
  address: "Dirección",
  amount: "Monto",
  balanceAfter: "Saldo después del movimiento",
  balanceBefore: "Saldo antes del movimiento",
  barcode: "Código de barras",
  batchId: "Lote",
  batchNumber: "Número de lote",
  birthDate: "Fecha de nacimiento",
  businessName: "Razón social",
  cashRegisterId: "Caja",
  categoryId: "Categoría",
  code: "Código",
  commune: "Comuna",
  concentration: "Concentración",
  contactName: "Persona de contacto",
  controlledDrugType: "Tipo de control",
  countedAmount: "Dinero contado",
  customerAddress: "Dirección del cliente",
  customerBusinessActivity: "Giro del cliente",
  customerBusinessName: "Razón social del cliente",
  customerName: "Nombre del cliente",
  customerRut: "RUT del cliente",
  description: "Descripción",
  destinationLocationId: "Ubicación de destino",
  discountType: "Tipo de descuento",
  discountValue: "Valor del descuento",
  doctorId: "Médico",
  dosage: "Dosis",
  duration: "Duración del tratamiento",
  email: "Correo electrónico",
  expectedDate: "Fecha esperada de llegada",
  expirationDate: "Fecha de vencimiento",
  fileUrl: "Enlace a la receta",
  firstName: "Nombres",
  folio: "Folio",
  frequency: "Frecuencia",
  isPublic: "Visible para todos",
  ispReference: "Referencia ISP",
  issueDate: "Fecha de emisión",
  key: "Clave",
  laboratoryId: "Laboratorio o marca",
  lastName: "Apellidos",
  maximumDiscount: "Descuento máximo",
  minimumQuantity: "Cantidad mínima",
  minimumStock: "Stock mínimo",
  movementType: "Tipo de movimiento",
  name: "Nombre",
  notes: "Notas",
  openingAmount: "Dinero inicial",
  origin: "Origen de la receta",
  password: "Contraseña",
  patientId: "Paciente",
  paymentMethod: "Medio de pago",
  pharmaceuticalForm: "Forma del medicamento",
  phone: "Teléfono",
  planId: "Plan",
  prescribedQuantity: "Cantidad recetada",
  prescriptionFolio: "Folio de la receta",
  prescriptionType: "Tipo de receta",
  presentation: "Presentación",
  productId: "Producto",
  productType: "Tipo de producto",
  purchasePrice: "Precio de compra",
  quantity: "Cantidad",
  quantityDelta: "Cantidad a sumar o restar",
  quantityOrdered: "Cantidad pedida",
  reason: "Motivo",
  recordNumber: "Número de registro",
  referenceCode: "Código del comprobante de pago",
  region: "Región",
  registration: "Registro profesional",
  retainedFileUrl: "Enlace a la receta retenida",
  roleId: "Rol",
  rut: "RUT",
  salePrice: "Precio de venta",
  sku: "Código interno (SKU)",
  specialty: "Especialidad",
  status: "Estado",
  supplierId: "Proveedor",
  taxDocumentType: "Tipo de documento",
  taxRate: "IVA",
  tradeName: "Nombre de fantasía",
  type: "Tipo",
  unitCost: "Costo por unidad",
  username: "Nombre de usuario",
  validFrom: "Vigente desde",
  validUntil: "Vigente hasta",
  value: "Valor",
};

export type ValidationIssue = {
  code?: string;
  path?: Array<string | number>;
  message?: string;
  origin?: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  inclusive?: boolean;
  format?: string;
  expected?: string;
  validation?: string;
  type?: string;
};

const fieldLabel = (path: ValidationIssue["path"]) => {
  const key = [...(path ?? [])].reverse().find((part) => typeof part === "string");
  if (!key) return null;
  return fieldNames[key] ?? key;
};

const describeProblem = (issue: ValidationIssue) => {
  const message = issue.message ?? "";
  const origin = issue.origin ?? issue.type;
  switch (issue.code) {
    case "invalid_type":
      if (/received undefined|required/i.test(message)) return "falta completar este dato.";
      if (issue.expected === "number") return "debe ser un número.";
      return "el dato no tiene el formato esperado.";
    case "too_small":
      if (origin === "string") {
        return Number(issue.minimum) <= 1
          ? "no puede quedar vacío."
          : `debe tener al menos ${issue.minimum} caracteres.`;
      }
      if (origin === "array" || origin === "set") return "agrega al menos un elemento.";
      return `debe ser ${issue.inclusive === false ? "mayor que" : "mayor o igual a"} ${issue.minimum}.`;
    case "too_big":
      if (origin === "string") return `puede tener como máximo ${issue.maximum} caracteres.`;
      return `no puede ser mayor que ${issue.maximum}.`;
    case "invalid_format":
    case "invalid_string": {
      const format = issue.format ?? issue.validation;
      if (format === "email") return "no tiene formato de correo. Ejemplo: nombre@correo.cl.";
      if (format === "uuid" || format === "guid") return "elige una opción de la lista.";
      if (format === "url") return "debe ser un enlace completo. Ejemplo: https://sitio.cl/receta.pdf.";
      if (format === "date" || format === "datetime") return "debe ser una fecha válida.";
      return "el formato no es correcto.";
    }
    case "invalid_value":
    case "invalid_enum_value":
      return "elige una de las opciones de la lista.";
    case "invalid_date":
      return "debe ser una fecha válida.";
    default:
      return message || "revisa este dato.";
  }
};

/** Convierte los detalles de validación del servidor en frases claras para la persona. */
export const describeValidationIssues = (issues: unknown): string | null => {
  if (!Array.isArray(issues) || !issues.length) return null;
  const lines = (issues as ValidationIssue[]).slice(0, 6).map((issue) => {
    const label = fieldLabel(issue.path);
    const problem = describeProblem(issue);
    return label ? `• «${label}»: ${problem}` : `• ${problem.charAt(0).toUpperCase()}${problem.slice(1)}`;
  });
  return `Hay datos por corregir antes de guardar:\n${lines.join("\n")}`;
};
