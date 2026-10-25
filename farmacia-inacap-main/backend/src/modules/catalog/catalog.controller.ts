import type { Request, Response } from "express";
import {
  basicCatalogCreateSchema,
  basicCatalogUpdateSchema,
  catalogQuerySchema,
  productCreateSchema,
  productUpdateSchema,
  productsQuerySchema,
} from "./catalog.schemas.js";
import * as service from "./catalog.service.js";
import { ApiError } from "../../utils/ApiError.js";

const getIdParam = (req: Request) => {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new ApiError(400, "ID inválido");
  }

  return id;
};

const kindFromPath = (req: Request) => {
  const base = req.baseUrl;

  if (base.endsWith("/categories")) {
    return "category" as const;
  }

  if (base.endsWith("/laboratories")) {
    return "laboratory" as const;
  }

  return "activeIngredient" as const;
};

export const listBasicController = async (
  req: Request,
  res: Response,
) => {
  res.json({
    ok: true,
    ...(await service.listBasicCatalog(
      kindFromPath(req),
      catalogQuerySchema.parse(req.query),
    )),
  });
};

export const getBasicController = async (
  req: Request,
  res: Response,
) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    item: await service.getBasicCatalog(
      kindFromPath(req),
      id,
    ),
  });
};

export const createBasicController = async (
  req: Request,
  res: Response,
) => {
  res.status(201).json({
    ok: true,
    item: await service.createBasicCatalog(
      kindFromPath(req),
      basicCatalogCreateSchema.parse(req.body),
    ),
  });
};

export const updateBasicController = async (
  req: Request,
  res: Response,
) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    item: await service.updateBasicCatalog(
      kindFromPath(req),
      id,
      basicCatalogUpdateSchema.parse(req.body),
    ),
  });
};

export const deleteBasicController = async (
  req: Request,
  res: Response,
) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    ...(await service.deleteBasicCatalog(
      kindFromPath(req),
      id,
    )),
  });
};

export const listProductsController = async (
  req: Request,
  res: Response,
) => {
  res.json({
    ok: true,
    ...(await service.listProducts(
      productsQuerySchema.parse(req.query),
    )),
  });
};

export const getProductController = async (
  req: Request,
  res: Response,
) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    product: await service.getProduct(id),
  });
};

export const createProductController = async (
  req: Request,
  res: Response,
) => {
  res.status(201).json({
    ok: true,
    product: await service.createProduct(
      productCreateSchema.parse(req.body),
    ),
  });
};

export const updateProductController = async (
  req: Request,
  res: Response,
) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    product: await service.updateProduct(
      id,
      productUpdateSchema.parse(req.body),
    ),
  });
};

export const deleteProductController = async (
  req: Request,
  res: Response,
) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    ...(await service.deleteProduct(id)),
  });
};