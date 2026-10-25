import { z } from "zod";
import { normalizeRut, validateRut } from "../../utils/rut.js";

export const agreementTypeSchema = z.enum([
  "ISAPRE",
  "INSURANCE",
  "CENABAST",
  "EMPLOYEE",
  "INSTITUTIONAL",
  "OTHER",
]);

export const discountTypeSchema = z.enum([
  "PERCENTAGE",
  "FIXED_AMOUNT",
  "FIXED_PRICE",
]);

export const agreementsQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: agreementTypeSchema.optional(),
  active: z.enum(["true", "false"]).optional(),
});

export const agreementCreateSchema = z.object({
  code: z.string().trim().min(2).max(50).transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2).max(180),
  type: agreementTypeSchema,
  rut: z
    .string()
    .trim()
    .max(20)
    .transform(normalizeRut)
    .refine(validateRut, {
      message: "RUT chileno inválido (dígito verificador incorrecto)",
    })
    .optional()
    .nullable(),
  description: z.string().trim().optional().nullable(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const agreementUpdateSchema = agreementCreateSchema.partial();

export const planCreateSchema = z.object({
  code: z.string().trim().min(2).max(80).transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().optional().nullable(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const planUpdateSchema = planCreateSchema.partial();

export const benefitCreateSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  discountType: discountTypeSchema,
  discountValue: z.coerce.number().nonnegative(),
  maximumDiscount: z.coerce.number().nonnegative().optional().nullable(),
  minimumQuantity: z.coerce.number().int().positive().default(1),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const benefitUpdateSchema = benefitCreateSchema.partial();

export const patientCoverageCreateSchema = z.object({
  patientId: z.string().uuid(),
  agreementPlanId: z.string().uuid(),
  beneficiaryCode: z.string().trim().max(100).optional().nullable(),
  policyNumber: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "EXPIRED"]).default("ACTIVE"),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  isPrimary: z.boolean().default(false),
});

const previewItem = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative().optional(),
});

export const previewCoverageSchema = z.object({
  patientCoverageId: z.string().uuid(),
  items: z.array(previewItem).min(1),
});

export const applyCoverageSchema = z.object({
  patientCoverageId: z.string().uuid(),
  approvedAmount: z.coerce.number().positive(),
  authorizationCode: z.string().trim().max(150).optional().nullable(),
  externalReference: z.string().trim().max(150).optional().nullable(),
  responseMessage: z.string().trim().optional().nullable(),
});
