import { z } from "zod";
import { normalizeRut, validateRut } from "../../utils/rut.js";

export const paymentMethodSchema = z.enum([
  "CASH",
  "DEBIT_CARD",
  "CREDIT_CARD",
  "BANK_TRANSFER",
  "OTHER",
]);

export const taxDocumentTypeSchema = z.enum(["RECEIPT", "INVOICE"]);

const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  discountAmount: z.coerce.number().nonnegative().default(0),
  prescriptionItemId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
});

const paymentSchema = z.object({
  method: paymentMethodSchema,
  amount: z.coerce.number().positive(),
  referenceCode: z.string().trim().max(150).optional().nullable(),
});

export const checkoutSchema = z.object({
  code: z.string().trim().min(3).max(100),
  cashSessionId: z.string().uuid(),
  patientId: z.string().uuid().optional().nullable(),

  customerRut: z
    .string()
    .trim()
    .max(20)
    .transform(normalizeRut)
    .refine(validateRut, {
      message: "RUT chileno inválido (dígito verificador incorrecto)",
    })
    .optional()
    .nullable(),
  customerName: z.string().trim().max(200).optional().nullable(),

  customerBusinessName: z.string().trim().max(200).optional().nullable(),
  customerBusinessActivity: z.string().trim().max(200).optional().nullable(),
  customerAddress: z.string().trim().max(255).optional().nullable(),

  notes: z.string().trim().optional().nullable(),

  taxRate: z.coerce.number().min(0).max(100).default(19),
  taxDocumentType: taxDocumentTypeSchema.default("RECEIPT"),

  items: z.array(checkoutItemSchema).min(1),
  payments: z.array(paymentSchema).min(1),
});

export const salesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["DRAFT", "COMPLETED", "CANCELLED", "REFUNDED"]).optional(),
  sellerId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  cashSessionId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const cancelSaleSchema = z.object({
  reason: z.string().trim().min(3).max(255),
});

export const issueTaxDocumentSchema = z.object({
  folio: z.string().trim().min(1).max(100).optional(),
});
