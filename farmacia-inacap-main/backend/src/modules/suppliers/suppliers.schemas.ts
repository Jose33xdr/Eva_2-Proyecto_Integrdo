import { z } from "zod";
import { normalizeRut, validateRut } from "../../utils/rut.js";

export const suppliersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  active: z.enum(["true", "false"]).optional(),
});

export const createSupplierSchema = z.object({
  rut: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .transform(normalizeRut)
    .refine(validateRut, {
      message: "RUT chileno inválido (dígito verificador incorrecto)",
    }),
  businessName: z.string().trim().min(2).max(180),
  tradeName: z.string().trim().max(180).optional().nullable(),
  contactName: z.string().trim().max(150).optional().nullable(),
  email: z.string().trim().email().max(150).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  commune: z.string().trim().max(100).optional().nullable(),
  region: z.string().trim().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateSupplierSchema = createSupplierSchema.partial();
