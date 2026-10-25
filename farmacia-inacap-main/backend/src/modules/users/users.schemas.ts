import { z } from "zod";
import { normalizeRut, validateRut } from "../../utils/rut.js";

export const userStatusSchema = z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]);

export const createUserSchema = z.object({
  rut: z
    .string()
    .trim()
    .transform(normalizeRut)
    .refine(validateRut, {
      message: "RUT chileno inválido (dígito verificador incorrecto)",
    }),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  username: z.string().trim().min(3).max(80),
  password: z.string().min(8).max(200),
  roleId: z.string().uuid(),
  status: userStatusSchema.default("ACTIVE"),
});

export const updateUserSchema = z.object({
  rut: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .transform(normalizeRut)
    .refine(validateRut, {
      message: "RUT chileno inválido (dígito verificador incorrecto)",
    })
    .optional(),
  firstName: z.string().trim().min(2).max(100).optional(),
  lastName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(150).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  username: z.string().trim().min(3).max(80).optional(),
  password: z.string().min(8).max(200).optional(),
  roleId: z.string().uuid().optional(),
  status: userStatusSchema.optional(),
});

export const usersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: userStatusSchema.optional(),
  roleId: z.string().uuid().optional(),
});
