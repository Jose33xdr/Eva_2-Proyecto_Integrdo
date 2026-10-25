import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { settingSchema } from "./settings.schemas.js";

export type SettingInput = z.infer<typeof settingSchema>;

export class SettingsService {
  async getSettings() {
    return prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });
  }

  async getPublicSettings() {
    return prisma.systemSetting.findMany({
      where: { isPublic: true },
      select: { key: true, value: true },
      orderBy: { key: "asc" },
    });
  }

  async updateSettings(data: SettingInput, _userId?: string) {
    if (!data.key.trim()) {
      throw new ApiError(400, "La clave de configuración es obligatoria");
    }

    return prisma.systemSetting.upsert({
      where: { key: data.key },
      update: data,
      create: data,
    });
  }
}

export const settingsService = new SettingsService();
