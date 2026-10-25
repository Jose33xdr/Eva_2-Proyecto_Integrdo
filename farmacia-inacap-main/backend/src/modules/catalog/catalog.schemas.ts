import { z } from "zod";

export const basicCatalogCreateSchema = z.object({
  code: z.string().trim().min(2).max(50).transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const basicCatalogUpdateSchema = basicCatalogCreateSchema.partial();

export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  active: z.enum(["true", "false"]).optional(),
});

export const productTypeSchema = z.enum([
  "MEDICINE",
  "MEDICAL_DEVICE",
  "HYGIENE",
  "PERSONAL_CARE",
  "SUPPLEMENT",
  "DERMOCOSMETIC",
  "OTHER",
]);

export const prescriptionTypeSchema = z.enum([
  "NONE",
  "SIMPLE",
  "RETAINED",
  "CHECK",
  "BALANCE_CONTROL",
]);

export const controlledDrugTypeSchema = z.enum([
  "NONE",
  "PSYCHOTROPIC",
  "NARCOTIC",
]);

const ingredientSchema = z.object({
  activeIngredientId: z.string().uuid(),
  quantity: z.coerce.number().positive().optional().nullable(),
  unit: z.string().trim().max(30).optional().nullable(),
});

export const productCreateSchema = z.object({
  sku: z.string().trim().min(2).max(60),
  barcode: z.string().trim().max(50).optional().nullable(),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().optional().nullable(),

  productType: productTypeSchema,
  prescriptionType: prescriptionTypeSchema.default("NONE"),
  controlledDrugType: controlledDrugTypeSchema.default("NONE"),

  requiresPrescription: z.boolean().default(false),
  isControlled: z.boolean().default(false),
  isCenabast: z.boolean().default(false),

  concentration: z.string().trim().max(100).optional().nullable(),
  pharmaceuticalForm: z.string().trim().max(100).optional().nullable(),
  presentation: z.string().trim().max(150).optional().nullable(),

  purchasePrice: z.coerce.number().nonnegative().optional().nullable(),
  salePrice: z.coerce.number().nonnegative(),
  cenabastMaxPrice: z.coerce.number().nonnegative().optional().nullable(),
  cenabastValidFrom: z.coerce.date().optional().nullable(),
  cenabastValidUntil: z.coerce.date().optional().nullable(),

  minimumStock: z.coerce.number().int().nonnegative().default(0),

  categoryId: z.string().uuid(),
  laboratoryId: z.string().uuid().optional().nullable(),

  isActive: z.boolean().default(true),
  activeIngredients: z.array(ingredientSchema).default([]),
});

export const productUpdateSchema = productCreateSchema.partial().extend({
  activeIngredients: z.array(ingredientSchema).optional(),
});

export const productsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  active: z.enum(["true", "false"]).optional(),
  categoryId: z.string().uuid().optional(),
  laboratoryId: z.string().uuid().optional(),
  productType: productTypeSchema.optional(),
  requiresPrescription: z.enum(["true", "false"]).optional(),
  isControlled: z.enum(["true", "false"]).optional(),
  isCenabast: z.enum(["true", "false"]).optional(),
});
