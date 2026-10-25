import type { Request, Response } from "express";
import { getRouteParam } from "../../utils/routeParam.js";
import {
  adjustmentSchema,
  alertsQuerySchema,
  batchesQuerySchema,
  fefoQuerySchema,
  scanAlertsSchema,
  stockQuerySchema,
  transferSchema,
} from "./inventory.schemas.js";
import * as service from "./inventory.service.js";

export const listLocationsController = async (_req: Request, res: Response) => {
  res.json({ ok: true, locations: await service.listLocations() });
};

export const listStockController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    ...(await service.listStock(stockQuerySchema.parse(req.query))),
  });
};

export const listBatchesController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    ...(await service.listBatches(batchesQuerySchema.parse(req.query))),
  });
};

export const transferStockController = async (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    movement: await service.transferStock(
      req.auth!.sub,
      transferSchema.parse(req.body),
    ),
  });
};

export const adjustStockController = async (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    movement: await service.adjustStock(
      req.auth!.sub,
      adjustmentSchema.parse(req.body),
    ),
  });
};

export const fefoController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    ...(await service.getFefoAllocation(
      getRouteParam(req, "productId"),
      fefoQuerySchema.parse(req.query),
    )),
  });
};

export const scanAlertsController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    ...(await service.scanAlerts(scanAlertsSchema.parse(req.body))),
  });
};

export const listAlertsController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    alerts: await service.listAlerts(alertsQuerySchema.parse(req.query)),
  });
};

export const resolveAlertController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    alert: await service.resolveAlert(
      getRouteParam(req, "id"),
      req.auth!.sub,
    ),
  });
};
