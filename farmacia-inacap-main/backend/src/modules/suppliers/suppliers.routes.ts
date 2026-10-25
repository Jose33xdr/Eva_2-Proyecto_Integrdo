import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createSupplierController,
  deleteSupplierController,
  getSupplierController,
  listSuppliersController,
  updateSupplierController,
} from "./suppliers.controller.js";

export const suppliersRouter = Router();

suppliersRouter.use(authenticate);
suppliersRouter.get("/", requirePermission("purchases.read"), asyncHandler(listSuppliersController));
suppliersRouter.get("/:id", requirePermission("purchases.read"), asyncHandler(getSupplierController));
suppliersRouter.post("/", requirePermission("purchases.create"), asyncHandler(createSupplierController));
suppliersRouter.patch("/:id", requirePermission("purchases.create"), asyncHandler(updateSupplierController));
suppliersRouter.delete("/:id", requirePermission("purchases.create"), asyncHandler(deleteSupplierController));
