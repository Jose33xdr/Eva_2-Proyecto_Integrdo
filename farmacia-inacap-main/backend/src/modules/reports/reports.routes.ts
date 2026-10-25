import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as c from "./reports.controller.js";

export const reportsRouter = Router();
reportsRouter.use(authenticate);

reportsRouter.get("/dashboard", requirePermission("reports.read"), asyncHandler(c.dashboard));
reportsRouter.get("/sales", requirePermission("reports.read"), asyncHandler(c.sales));
reportsRouter.get("/inventory", requirePermission("reports.read"), asyncHandler(c.inventory));
reportsRouter.get("/purchases", requirePermission("reports.read"), asyncHandler(c.purchases));
reportsRouter.get("/cash", requirePermission("reports.read"), asyncHandler(c.cash));
reportsRouter.get("/controlled", requirePermission("reports.read"), asyncHandler(c.controlled));

reportsRouter.get("/sales.xlsx", requirePermission("reports.export"), asyncHandler(c.salesExcel));
reportsRouter.get("/inventory.xlsx", requirePermission("reports.export"), asyncHandler(c.inventoryExcel));
reportsRouter.get("/sales.pdf", requirePermission("reports.export"), asyncHandler(c.salesPdf));

reportsRouter.get("/audit", requirePermission("audit.read"), asyncHandler(c.audit));
