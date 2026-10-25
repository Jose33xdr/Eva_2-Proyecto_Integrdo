import { z } from "zod";
import { normalizeRut, validateRut } from "../../utils/rut.js";
const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
};

export const patientsQuerySchema = z.object({
  ...pageQuery,
  active: z.enum(["true", "false"]).optional(),
});

export const patientCreateSchema = z.object({
  rut: z
    .string()
    .trim()
    .transform(normalizeRut)
    .refine(validateRut, {
      message: "RUT chileno inválido (dígito verificador incorrecto)",
    }),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  birthDate: z.coerce.date().optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email().max(150).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const patientUpdateSchema = patientCreateSchema.partial();

export const doctorsQuerySchema = z.object({
  ...pageQuery,
  active: z.enum(["true", "false"]).optional(),
});

export const doctorCreateSchema = z.object({
  rut: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .transform(normalizeRut)
    .refine(validateRut, {
      message: "RUT chileno inválido (dígito verificador incorrecto)",
    }),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  specialty: z.string().trim().max(150).optional().nullable(),
  registration: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email().max(150).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const doctorUpdateSchema = doctorCreateSchema.partial();

export const prescriptionOriginSchema = z.enum(["PHYSICAL", "DIGITAL"]);
export const prescriptionTypeSchema = z.enum([
  "NONE",
  "SIMPLE",
  "RETAINED",
  "CHECK",
  "BALANCE_CONTROL",
]);

const prescriptionItemSchema = z.object({
  productId: z.string().uuid(),
  prescribedQuantity: z.coerce.number().int().positive(),
  dosage: z.string().trim().max(255).optional().nullable(),
  frequency: z.string().trim().max(150).optional().nullable(),
  duration: z.string().trim().max(150).optional().nullable(),
});

export const prescriptionCreateSchema = z.object({
  folio: z.string().trim().min(2).max(100),
  origin: prescriptionOriginSchema,
  prescriptionType: prescriptionTypeSchema,
  issueDate: z.coerce.date(),
  expirationDate: z.coerce.date().optional().nullable(),
  hasBalanceControl: z.boolean().default(false),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  fileUrl: z.string().trim().max(500).optional().nullable(),
  retainedFileUrl: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  items: z.array(prescriptionItemSchema).min(1),
});

export const prescriptionsQuerySchema = z.object({
  ...pageQuery,
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  status: z
    .enum(["ACTIVE", "PARTIALLY_DISPENSED", "DISPENSED", "EXPIRED", "CANCELLED"])
    .optional(),
  prescriptionType: prescriptionTypeSchema.optional(),
});

export const cancelPrescriptionSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const dispensationFromSaleSchema = z.object({
  prescriptionId: z.string().uuid(),
  saleId: z.string().uuid(),
  code: z.string().trim().min(3).max(100),
  notes: z.string().trim().optional().nullable(),
});

export const controlledQuerySchema = z.object({
  ...pageQuery,
  productId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  movementType: z
    .enum([
      "PURCHASE_RECEIPT",
      "DISPENSATION",
      "RETURN",
      "ADJUSTMENT_IN",
      "ADJUSTMENT_OUT",
      "DESTRUCTION",
    ])
    .optional(),
  status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
});

export const controlledManualSchema = z.object({
  recordNumber: z.string().trim().min(3).max(100),
  movementType: z.enum([
    "PURCHASE_RECEIPT",
    "RETURN",
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
    "DESTRUCTION",
  ]),
  productId: z.string().uuid(),
  batchId: z.string().uuid().optional().nullable(),
  prescriptionId: z.string().uuid().optional().nullable(),
  patientId: z.string().uuid().optional().nullable(),
  doctorId: z.string().uuid().optional().nullable(),
  quantity: z.coerce.number().int().positive(),
  balanceBefore: z.coerce.number().int().optional().nullable(),
  balanceAfter: z.coerce.number().int().optional().nullable(),
  prescriptionFolio: z.string().trim().max(100).optional().nullable(),
  ispReference: z.string().trim().max(150).optional().nullable(),
  reason: z.string().trim().min(3).optional().nullable(),
});
