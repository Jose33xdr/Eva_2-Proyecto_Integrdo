import { z } from "zod";

export const settingSchema = z.object({
  key: z.string().trim().min(2).max(120),
  value: z.string(),
  description: z.string().trim().max(255).optional().nullable(),
  isPublic: z.boolean().default(false),
});
