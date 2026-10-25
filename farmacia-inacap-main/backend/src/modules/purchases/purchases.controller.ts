import type { Request, Response } from "express";
import { getRouteParam } from "../../utils/routeParam.js";
import {
  createPurchaseOrderSchema,
  purchaseOrdersQuerySchema,
  receivePurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
} from "./purchases.schemas.js";
import * as service from "./purchases.service.js";

export const listPurchaseOrdersController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    ...(await service.listPurchaseOrders(
      purchaseOrdersQuerySchema.parse(req.query),
    )),
  });
};

export const getPurchaseOrderController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    order: await service.getPurchaseOrder(getRouteParam(req, "id")),
  });
};

export const createPurchaseOrderController = async (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    order: await service.createPurchaseOrder(
      req.auth!.sub,
      createPurchaseOrderSchema.parse(req.body),
    ),
  });
};

export const updatePurchaseOrderStatusController = async (
  req: Request,
  res: Response,
) => {
  res.json({
    ok: true,
    order: await service.updatePurchaseOrderStatus(
      getRouteParam(req, "id"),
      updatePurchaseOrderStatusSchema.parse(req.body),
    ),
  });
};

export const receivePurchaseOrderController = async (
  req: Request,
  res: Response,
) => {
  res.status(201).json({
    ok: true,
    receipt: await service.receivePurchaseOrder(
      getRouteParam(req, "id"),
      req.auth!.sub,
      receivePurchaseOrderSchema.parse(req.body),
    ),
  });
};
