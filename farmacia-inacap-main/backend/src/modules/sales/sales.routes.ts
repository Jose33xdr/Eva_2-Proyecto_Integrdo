import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  cancelSaleController,
  checkoutController,
  getSaleController,
  issueTaxDocumentController,
  listSalesController,
} from "./sales.controller.js";

export const salesRouter = Router();

salesRouter.use(authenticate);

salesRouter.get("/", requirePermission("sales.read"), asyncHandler(listSalesController));
salesRouter.get("/:id", requirePermission("sales.read"), asyncHandler(getSaleController));
salesRouter.post("/checkout", requirePermission("sales.create"), asyncHandler(checkoutController));
salesRouter.post("/:id/cancel", requirePermission("sales.cancel"), asyncHandler(cancelSaleController));
salesRouter.post("/:id/tax-document/mock-issue", requirePermission("sales.create"), asyncHandler(issueTaxDocumentController));
