import { z } from "zod";

export const roleCreateSchema = z.object({
  code: z.string().trim().min(2).max(50).transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().default(true),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const roleUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const permissionCreateSchema = z.object({
  code: z.string().trim().min(3).max(100),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(255).optional().nullable(),
  module: z.string().trim().min(2).max(80),
  action: z.string().trim().min(2).max(80),
  isActive: z.boolean().default(true),
});

export const permissionUpdateSchema = permissionCreateSchema.partial();

export const accessQuerySchema = z.object({
  search: z.string().trim().optional(),
  active: z.enum(["true", "false"]).optional(),
});
