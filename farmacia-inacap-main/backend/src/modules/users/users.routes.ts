import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createUserController,
  deleteUserController,
  getUserController,
  listUsersController,
  updateUserController,
} from "./users.controller.js";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get("/", requirePermission("users.read"), asyncHandler(listUsersController));
usersRouter.get("/:id", requirePermission("users.read"), asyncHandler(getUserController));
usersRouter.post("/", requirePermission("users.create"), asyncHandler(createUserController));
usersRouter.patch("/:id", requirePermission("users.update"), asyncHandler(updateUserController));
usersRouter.delete("/:id", requirePermission("users.delete"), asyncHandler(deleteUserController));
