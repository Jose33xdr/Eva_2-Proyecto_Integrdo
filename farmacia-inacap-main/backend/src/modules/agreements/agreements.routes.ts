import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as c from "./agreements.controller.js";

export const agreementsRouter = Router();
agreementsRouter.use(authenticate);

agreementsRouter.get("/", requirePermission("agreements.read"), asyncHandler(c.list));
agreementsRouter.get("/:id", requirePermission("agreements.read"), asyncHandler(c.get));
agreementsRouter.post("/", requirePermission("agreements.manage"), asyncHandler(c.create));
agreementsRouter.patch("/:id", requirePermission("agreements.manage"), asyncHandler(c.update));

agreementsRouter.post("/:id/plans", requirePermission("agreements.manage"), asyncHandler(c.createPlan));
agreementsRouter.patch("/plans/:planId", requirePermission("agreements.manage"), asyncHandler(c.updatePlan));
agreementsRouter.post("/plans/:planId/benefits", requirePermission("agreements.manage"), asyncHandler(c.createBenefit));
agreementsRouter.patch("/benefits/:benefitId", requirePermission("agreements.manage"), asyncHandler(c.updateBenefit));

agreementsRouter.post("/patient-coverages", requirePermission("agreements.manage"), asyncHandler(c.createCoverage));
agreementsRouter.post("/preview", requirePermission("agreements.read"), asyncHandler(c.preview));
agreementsRouter.post("/sales/:saleId/apply", requirePermission("agreements.manage"), asyncHandler(c.apply));
