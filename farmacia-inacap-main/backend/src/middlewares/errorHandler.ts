import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { ApiError } from "../utils/ApiError.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: {
        message: "Datos de entrada inválidos",
        details: error.issues,
      },
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      ok: false,
      error: {
        message: error.message,
        details: error.details ?? null,
      },
    });
    return;
  }

  const prismaCode =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (prismaCode === "P2002") {
    res.status(409).json({
      ok: false,
      error: {
        message: "Ya existe un registro con uno de los valores únicos enviados",
      },
    });
    return;
  }

  if (prismaCode === "P2003") {
    res.status(409).json({
      ok: false,
      error: {
        message: "El registro está siendo utilizado y no puede eliminarse",
      },
    });
    return;
  }

  if (prismaCode === "P2025") {
    res.status(404).json({
      ok: false,
      error: {
        message: "Registro no encontrado",
      },
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    ok: false,
    error: {
      message: "Error interno del servidor",
    },
  });
};
