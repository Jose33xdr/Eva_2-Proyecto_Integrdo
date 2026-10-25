import type { Request, Response } from "express";
import { settingSchema } from "./settings.schemas.js";
import { settingsService } from "./settings.service.js";

export const listSettings = async (_req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  res.json({ ok: true, settings });
};

export const upsertSetting = async (req: Request, res: Response) => {
  const input = settingSchema.parse(req.body);
  const setting = await settingsService.updateSettings(input, req.auth?.sub);
  res.json({ ok: true, setting });
};

export const publicSettings = async (_req: Request, res: Response) => {
  const settings = await settingsService.getPublicSettings();
  res.json({ ok: true, settings });
};
