import type { Request, Response } from "express";

import { loginSchema, refreshSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";

export const loginController = async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);

  return res.status(200).json({
    ok: true,
    ...result,
  });
};

export const refreshController = async (req: Request, res: Response) => {
  const input = refreshSchema.parse(req.body);
  const result = await authService.refresh(input.refreshToken);

  return res.status(200).json({
    ok: true,
    ...result,
  });
};

export const logoutController = async (req: Request, res: Response) => {
  const input = refreshSchema.parse(req.body);
  await authService.logout(input.refreshToken);

  return res.status(200).json({
    ok: true,
    message: "Sesión cerrada correctamente",
  });
};

export const meController = async (req: Request, res: Response) => {
  const user = await authService.getMe(req.auth!.sub);

  return res.status(200).json({
    ok: true,
    user,
  });
};
