import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createPermissionController,
  createRoleController,
  deletePermissionController,
  deleteRoleController,
  getRoleController,
  listPermissionsController,
  listRolesController,
  updatePermissionController,
  updateRoleController,
} from "./access.controller.js";

export const accessRouter = Router();

accessRouter.use(authenticate);

accessRouter.get("/roles", requirePermission("users.read"), asyncHandler(listRolesController));
accessRouter.get("/roles/:id", requirePermission("users.read"), asyncHandler(getRoleController));
accessRouter.post("/roles", requirePermission("users.create"), asyncHandler(createRoleController));
accessRouter.patch("/roles/:id", requirePermission("users.update"), asyncHandler(updateRoleController));
accessRouter.delete("/roles/:id", requirePermission("users.delete"), asyncHandler(deleteRoleController));

accessRouter.get("/permissions", requirePermission("users.read"), asyncHandler(listPermissionsController));
accessRouter.post("/permissions", requirePermission("users.create"), asyncHandler(createPermissionController));
accessRouter.patch("/permissions/:id", requirePermission("users.update"), asyncHandler(updatePermissionController));
accessRouter.delete("/permissions/:id", requirePermission("users.delete"), asyncHandler(deletePermissionController));
