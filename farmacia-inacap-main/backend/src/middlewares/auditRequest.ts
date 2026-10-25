import type { NextFunction, Request, Response } from "express";
import type { AuditAction } from "../../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";

type AuditContext = {
  startedAt: number;
  method: string;
  path: string;
  module: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveAuditAction = (
  method: string,
  path: string,
  statusCode: number,
): AuditAction => {
  const upperMethod = method.toUpperCase();
  const lowerPath = path.toLowerCase();

  if (lowerPath.endsWith("/auth/login")) {
    return statusCode >= 400 ? "LOGIN_FAILED" : "LOGIN";
  }

  if (lowerPath.endsWith("/auth/logout")) {
    return "LOGOUT";
  }

  if (/\/cancel(\/|$)/i.test(lowerPath)) {
    return "CANCEL";
  }

  if (/\.(xlsx|pdf|csv)$/i.test(lowerPath) || /\/export(\/|$)/i.test(lowerPath)) {
    return "EXPORT";
  }

  if (/\/print(\/|$)/i.test(lowerPath)) {
    return "PRINT";
  }

  if (/\/(approve|resolve)(\/|$)/i.test(lowerPath)) {
    return "APPROVE";
  }

  switch (upperMethod) {
    case "POST":
      return "CREATE";
    case "PUT":
    case "PATCH":
      return "UPDATE";
    case "DELETE":
      return "DELETE";
    case "GET":
      return "READ";
    default:
      return "OTHER";
  }
};

const extractEntityIdFromPayload = (payload: unknown): {
  entityId: string | null;
  userId: string | null;
} => {
  if (!payload || typeof payload !== "object") {
    return { entityId: null, userId: null };
  }

  const record = payload as Record<string, unknown>;
  const directUser =
    record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : null;
  const userId =
    directUser && typeof directUser.id === "string" ? directUser.id : null;

  if (typeof record.id === "string") {
    return { entityId: record.id, userId };
  }

  for (const key of Object.keys(record)) {
    if (key === "ok" || key === "meta") continue;
    const val = record[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const nested = val as Record<string, unknown>;
      if (typeof nested.id === "string") {
        return { entityId: nested.id, userId };
      }
    }
  }

  return { entityId: null, userId };
};

export const auditRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const rawUrl = req.originalUrl || req.url || "/";
  const path = (rawUrl.split("?")[0] ?? rawUrl) || "/";
  const segments = path.split("/").filter(Boolean);
  const apiOffset = segments[0] === "api" ? 1 : 0;
  const moduleName = segments[apiOffset] ?? "api";

  const urlEntityId =
    segments.slice(apiOffset + 1).find((seg) => UUID_REGEX.test(seg)) ?? null;

  const nonUuidSegments = segments
    .slice(apiOffset)
    .filter((seg) => !UUID_REGEX.test(seg));
  const entityName = nonUuidSegments.join("/") || moduleName;

  const auditContext: AuditContext = {
    startedAt: Date.now(),
    method: req.method.toUpperCase(),
    path,
    module: moduleName.slice(0, 100),
    entity: entityName.slice(0, 100),
    entityId: urlEntityId ? urlEntityId.slice(0, 100) : null,
    userId: null,
  };

  res.locals.auditContext = auditContext;

  const originalJson = res.json.bind(res);
  res.json = ((body?: unknown) => {
    const extracted = extractEntityIdFromPayload(body);
    if (!auditContext.entityId && extracted.entityId) {
      auditContext.entityId = extracted.entityId.slice(0, 100);
    }
    if (!auditContext.userId && extracted.userId) {
      auditContext.userId = extracted.userId;
    }
    return originalJson(body);
  }) as Response["json"];

  res.on("finish", () => {
    const isExportGet =
      auditContext.method === "GET" &&
      (/\.(xlsx|pdf|csv)$/i.test(auditContext.path) ||
        /\/export(\/|$)/i.test(auditContext.path));

    if (
      (auditContext.method === "GET" && !isExportGet) ||
      auditContext.method === "HEAD" ||
      auditContext.method === "OPTIONS"
    ) {
      return;
    }

    const paramId =
      typeof req.params?.id === "string"
        ? req.params.id
        : typeof req.params?.saleId === "string"
          ? req.params.saleId
          : typeof req.params?.planId === "string"
            ? req.params.planId
            : typeof req.params?.benefitId === "string"
              ? req.params.benefitId
              : null;

    const finalEntityId =
      (paramId ?? auditContext.entityId)?.slice(0, 100) ?? null;

    const finalUserId = req.auth?.sub ?? auditContext.userId ?? null;
    const action = resolveAuditAction(
      auditContext.method,
      auditContext.path,
      res.statusCode,
    );

    void prisma.auditLog
      .create({
        data: {
          userId: finalUserId,
          action,
          module: auditContext.module,
          entity: auditContext.entity,
          entityId: finalEntityId,
          description: `${auditContext.method} ${auditContext.path} -> ${res.statusCode}`,
          metadata: {
            method: auditContext.method,
            path: auditContext.path,
            statusCode: res.statusCode,
            durationMs: Date.now() - auditContext.startedAt,
          },
          ipAddress: req.ip?.slice(0, 64) ?? null,
          userAgent: req.get("user-agent")?.slice(0, 500) ?? null,
        },
      })
      .catch((error) => {
        console.error("No se pudo registrar auditoría:", error);
      });
  });

  next();
};
