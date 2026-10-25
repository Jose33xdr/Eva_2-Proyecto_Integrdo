import { z } from "zod";

export const periodQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  module: z.string().trim().optional(),
  action: z
    .enum([
      "CREATE",
      "READ",
      "UPDATE",
      "DELETE",
      "LOGIN",
      "LOGOUT",
      "LOGIN_FAILED",
      "EXPORT",
      "PRINT",
      "APPROVE",
      "CANCEL",
      "OTHER",
    ])
    .optional(),
  userId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
