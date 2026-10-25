import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  closeSessionController,
  createRegisterController,
  getSessionController,
  listRegistersController,
  listSessionsController,
  movementController,
  openSessionController,
  updateRegisterController,
} from "./cash.controller.js";

export const cashRouter = Router();

cashRouter.use(authenticate);

cashRouter.get("/registers", requirePermission("cash.read"), asyncHandler(listRegistersController));
cashRouter.post("/registers", requirePermission("cash.adjust"), asyncHandler(createRegisterController));
cashRouter.patch("/registers/:id", requirePermission("cash.adjust"), asyncHandler(updateRegisterController));

cashRouter.get("/sessions", requirePermission("cash.read"), asyncHandler(listSessionsController));
cashRouter.get("/sessions/:id", requirePermission("cash.read"), asyncHandler(getSessionController));
cashRouter.post("/sessions/open", requirePermission("cash.open"), asyncHandler(openSessionController));
cashRouter.post("/sessions/:id/close", requirePermission("cash.close"), asyncHandler(closeSessionController));
cashRouter.post("/sessions/:id/movements", requirePermission("cash.adjust"), asyncHandler(movementController));
