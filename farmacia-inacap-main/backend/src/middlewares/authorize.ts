import type { RequestHandler } from "express";

import { ApiError } from "../utils/ApiError.js";

export const requireRole = (...roles: string[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new ApiError(401, "Autenticación requerida"));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(new ApiError(403, "No tienes permisos para realizar esta acción"));
      return;
    }

    next();
  };
};

export const requirePermission = (...permissions: string[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new ApiError(401, "Autenticación requerida"));
      return;
    }

    if (req.auth.role === "ADMIN") {
      next();
      return;
    }

    const hasPermission = permissions.every((permission) =>
      req.auth!.permissions.includes(permission),
    );

    if (!hasPermission) {
      next(new ApiError(403, "No tienes permisos para realizar esta acción"));
      return;
    }

    next();
  };
};
