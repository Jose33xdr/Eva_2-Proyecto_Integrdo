import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middlewares/authenticate.js";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
} from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(loginController));
authRouter.post("/refresh", asyncHandler(refreshController));
authRouter.post("/logout", asyncHandler(logoutController));
authRouter.get("/me", authenticate, asyncHandler(meController));
