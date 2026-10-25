import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new ApiError(
      404,
      `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    ),
  );
};
