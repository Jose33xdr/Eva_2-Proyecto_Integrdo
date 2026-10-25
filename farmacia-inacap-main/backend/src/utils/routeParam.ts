import type { Request } from "express";
import { ApiError } from "./ApiError.js";

export const getRouteParam = (req: Request, name: string) => {
  const value = req.params[name];

  if (!value || Array.isArray(value)) {
    throw new ApiError(400, `Parámetro inválido: ${name}`);
  }

  return value;
};
