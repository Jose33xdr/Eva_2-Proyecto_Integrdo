import { z } from "zod";

export const cashRegistersQuerySchema = z.object({
  active: z.enum(["true", "false"]).optional(),
  search: z.string().trim().optional(),
});

export const createCashRegisterSchema = z.object({
  code: z.string().trim().min(2).max(50).transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateCashRegisterSchema = createCashRegisterSchema.partial();

export const openCashSessionSchema = z.object({
  cashRegisterId: z.string().uuid(),
  openingAmount: z.coerce.number().nonnegative().default(0),
  notes: z.string().trim().optional().nullable(),
});

export const closeCashSessionSchema = z.object({
  countedAmount: z.coerce.number().nonnegative(),
  notes: z.string().trim().optional().nullable(),
});

export const cashMovementTypeSchema = z.enum([
  "INCOME",
  "EXPENSE",
  "WITHDRAWAL",
  "ADJUSTMENT",
]);

export const createCashMovementSchema = z
  .object({
    type: cashMovementTypeSchema,
    amount: z.coerce
      .number()
      .refine((v) => v !== 0, { message: "El monto no puede ser 0" }),
    description: z.string().trim().min(3).max(255),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "ADJUSTMENT" && data.amount <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "El monto debe ser positivo para este tipo de movimiento",
      });
    }
  });

export const cashSessionsQuerySchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "CANCELLED"]).optional(),
  cashRegisterId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
