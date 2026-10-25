import { z } from "zod";

export const purchaseOrderStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);

export const purchaseOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  supplierId: z.string().uuid().optional(),
  status: purchaseOrderStatusSchema.optional(),
});

const orderDetailSchema = z.object({
  productId: z.string().uuid(),
  quantityOrdered: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().nonnegative(),
});

export const createPurchaseOrderSchema = z.object({
  code: z.string().trim().min(3).max(50),
  supplierId: z.string().uuid(),
  expectedDate: z.coerce.date().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(19),
  details: z.array(orderDetailSchema).min(1),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: purchaseOrderStatusSchema,
});

const receiptItemSchema = z.object({
  productId: z.string().uuid(),
  batchNumber: z.string().trim().min(1).max(100),
  expirationDate: z.coerce.date(),
  manufacturingDate: z.coerce.date().optional().nullable(),
  quantity: z.coerce.number().int().positive(),
  purchasePrice: z.coerce.number().nonnegative(),
  locationId: z.string().uuid(),
});

export const receivePurchaseOrderSchema = z.object({
  code: z.string().trim().min(3).max(50),
  notes: z.string().trim().optional().nullable(),
  items: z.array(receiptItemSchema).min(1),
});
