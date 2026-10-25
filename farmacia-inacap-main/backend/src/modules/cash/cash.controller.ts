import type { Request, Response } from "express";
import { getRouteParam } from "../../utils/routeParam.js";
import {
  cashRegistersQuerySchema,
  cashSessionsQuerySchema,
  closeCashSessionSchema,
  createCashMovementSchema,
  createCashRegisterSchema,
  openCashSessionSchema,
  updateCashRegisterSchema,
} from "./cash.schemas.js";
import * as service from "./cash.service.js";

export const listRegistersController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    registers: await service.listCashRegisters(
      cashRegistersQuerySchema.parse(req.query),
    ),
  });
};

export const createRegisterController = async (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    register: await service.createCashRegister(
      createCashRegisterSchema.parse(req.body),
    ),
  });
};

export const updateRegisterController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    register: await service.updateCashRegister(
      getRouteParam(req, "id"),
      updateCashRegisterSchema.parse(req.body),
    ),
  });
};

export const listSessionsController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    sessions: await service.listCashSessions(
      cashSessionsQuerySchema.parse(req.query),
    ),
  });
};

export const getSessionController = async (req: Request, res: Response) => {
  const session = await service.getCashSession(getRouteParam(req, "id"));
  const expectedAmount =
    session.status === "OPEN"
      ? await service.getExpectedCashAmount(session.id)
      : Number(session.expectedAmount ?? 0);

  res.json({ ok: true, session, expectedAmount });
};

export const openSessionController = async (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    session: await service.openCashSession(
      req.auth!.sub,
      openCashSessionSchema.parse(req.body),
    ),
  });
};

export const closeSessionController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    session: await service.closeCashSession(
      getRouteParam(req, "id"),
      req.auth!.sub,
      closeCashSessionSchema.parse(req.body),
    ),
  });
};

export const movementController = async (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    movement: await service.createCashMovement(
      getRouteParam(req, "id"),
      req.auth!.sub,
      createCashMovementSchema.parse(req.body),
    ),
  });
};
