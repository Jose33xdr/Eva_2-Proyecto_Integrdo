import { z } from "zod";

export const stockQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  productId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  expiringDays: z.coerce.number().int().positive().max(3650).optional(),
});

export const batchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  productId: z.string().uuid().optional(),
  blocked: z.enum(["true", "false"]).optional(),
});

export const transferSchema = z.object({
  batchId: z.string().uuid(),
  originLocationId: z.string().uuid(),
  destinationLocationId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().max(255).optional().nullable(),
});

export const adjustmentSchema = z.object({
  batchId: z.string().uuid(),
  locationId: z.string().uuid(),
  quantityDelta: z.coerce.number().int().refine((v) => v !== 0, {
    message: "quantityDelta no puede ser 0",
  }),
  reason: z.string().trim().min(3).max(255),
});

export const fefoQuerySchema = z.object({
  quantity: z.coerce.number().int().positive(),
  locationId: z.string().uuid().optional(),
});

export const scanAlertsSchema = z.object({
  expiringDays: z.coerce.number().int().positive().max(365).default(90),
});

export const alertsQuerySchema = z.object({
  status: z.enum(["PENDING", "READ", "RESOLVED", "DISMISSED"]).optional(),
  type: z.enum([
    "LOW_STOCK",
    "OUT_OF_STOCK",
    "EXPIRING_SOON",
    "EXPIRED",
    "CONTROLLED_STOCK",
    "PRESCRIPTION_EXPIRING",
    "OTHER",
  ]).optional(),
});
