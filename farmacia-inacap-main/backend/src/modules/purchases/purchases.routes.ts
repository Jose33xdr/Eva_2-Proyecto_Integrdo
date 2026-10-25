import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createPurchaseOrderController,
  getPurchaseOrderController,
  listPurchaseOrdersController,
  receivePurchaseOrderController,
  updatePurchaseOrderStatusController,
} from "./purchases.controller.js";

export const purchasesRouter = Router();

purchasesRouter.use(authenticate);

purchasesRouter.get("/", requirePermission("purchases.read"), asyncHandler(listPurchaseOrdersController));
purchasesRouter.get("/:id", requirePermission("purchases.read"), asyncHandler(getPurchaseOrderController));
purchasesRouter.post("/", requirePermission("purchases.create"), asyncHandler(createPurchaseOrderController));
purchasesRouter.patch("/:id/status", requirePermission("purchases.create"), asyncHandler(updatePurchaseOrderStatusController));
purchasesRouter.post("/:id/receive", requirePermission("purchases.receive"), asyncHandler(receivePurchaseOrderController));
