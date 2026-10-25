import type { Request, Response } from "express";
import { getRouteParam } from "../../utils/routeParam.js";
import {
  createSupplierSchema,
  suppliersQuerySchema,
  updateSupplierSchema,
} from "./suppliers.schemas.js";
import * as service from "./suppliers.service.js";

export const listSuppliersController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    ...(await service.listSuppliers(suppliersQuerySchema.parse(req.query))),
  });
};

export const getSupplierController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    supplier: await service.getSupplier(getRouteParam(req, "id")),
  });
};

export const createSupplierController = async (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    supplier: await service.createSupplier(createSupplierSchema.parse(req.body)),
  });
};

export const updateSupplierController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    supplier: await service.updateSupplier(
      getRouteParam(req, "id"),
      updateSupplierSchema.parse(req.body),
    ),
  });
};

export const deleteSupplierController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    ...(await service.deleteSupplier(getRouteParam(req, "id"))),
  });
};
