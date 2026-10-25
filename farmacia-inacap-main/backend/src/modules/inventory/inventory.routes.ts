import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  adjustStockController,
  fefoController,
  listAlertsController,
  listBatchesController,
  listLocationsController,
  listStockController,
  resolveAlertController,
  scanAlertsController,
  transferStockController,
} from "./inventory.controller.js";

export const inventoryRouter = Router();

inventoryRouter.use(authenticate);

inventoryRouter.get("/locations", requirePermission("inventory.read"), asyncHandler(listLocationsController));
inventoryRouter.get("/stock", requirePermission("inventory.read"), asyncHandler(listStockController));
inventoryRouter.get("/batches", requirePermission("inventory.read"), asyncHandler(listBatchesController));
inventoryRouter.get("/fefo/:productId", requirePermission("inventory.read"), asyncHandler(fefoController));

inventoryRouter.post("/transfers", requirePermission("inventory.update"), asyncHandler(transferStockController));
inventoryRouter.post("/adjustments", requirePermission("inventory.adjust"), asyncHandler(adjustStockController));

inventoryRouter.get("/alerts", requirePermission("inventory.read"), asyncHandler(listAlertsController));
inventoryRouter.post("/alerts/scan", requirePermission("inventory.update"), asyncHandler(scanAlertsController));
inventoryRouter.patch("/alerts/:id/resolve", requirePermission("inventory.update"), asyncHandler(resolveAlertController));
