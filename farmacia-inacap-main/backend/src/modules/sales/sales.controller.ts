import type { Request, Response } from "express";
import { getRouteParam } from "../../utils/routeParam.js";
import {
  cancelSaleSchema,
  checkoutSchema,
  issueTaxDocumentSchema,
  salesQuerySchema,
} from "./sales.schemas.js";
import * as service from "./sales.service.js";

export const listSalesController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    ...(await service.listSales(salesQuerySchema.parse(req.query))),
  });
};

export const getSaleController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    sale: await service.getSale(getRouteParam(req, "id")),
  });
};

export const checkoutController = async (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    sale: await service.checkout(
      req.auth!.sub,
      checkoutSchema.parse(req.body),
    ),
  });
};

export const cancelSaleController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    sale: await service.cancelSale(
      getRouteParam(req, "id"),
      req.auth!.sub,
      cancelSaleSchema.parse(req.body),
    ),
  });
};

export const issueTaxDocumentController = async (
  req: Request,
  res: Response,
) => {
  res.json({
    ok: true,
    taxDocument: await service.issueTaxDocumentMock(
      getRouteParam(req, "id"),
      issueTaxDocumentSchema.parse(req.body),
    ),
  });
};
