import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  listSettings,
  publicSettings,
  upsertSetting,
} from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get("/public", asyncHandler(publicSettings));
settingsRouter.get("/", authenticate, requirePermission("settings.manage"), asyncHandler(listSettings));
settingsRouter.put("/", authenticate, requirePermission("settings.manage"), asyncHandler(upsertSetting));
