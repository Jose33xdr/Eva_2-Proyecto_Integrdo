import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createBasicController,
  createProductController,
  deleteBasicController,
  deleteProductController,
  getBasicController,
  getProductController,
  listBasicController,
  listProductsController,
  updateBasicController,
  updateProductController,
} from "./catalog.controller.js";

const makeBasicRouter = () => {
  const router = Router();
  router.use(authenticate);
  router.get("/", requirePermission("products.read"), asyncHandler(listBasicController));
  router.get("/:id", requirePermission("products.read"), asyncHandler(getBasicController));
  router.post("/", requirePermission("products.create"), asyncHandler(createBasicController));
  router.patch("/:id", requirePermission("products.update"), asyncHandler(updateBasicController));
  router.delete("/:id", requirePermission("products.delete"), asyncHandler(deleteBasicController));
  return router;
};

export const categoriesRouter = makeBasicRouter();
export const laboratoriesRouter = makeBasicRouter();
export const activeIngredientsRouter = makeBasicRouter();

export const productsRouter = Router();

productsRouter.use(authenticate);
productsRouter.get("/", requirePermission("products.read"), asyncHandler(listProductsController));
productsRouter.get("/:id", requirePermission("products.read"), asyncHandler(getProductController));
productsRouter.post("/", requirePermission("products.create"), asyncHandler(createProductController));
productsRouter.patch("/:id", requirePermission("products.update"), asyncHandler(updateProductController));
productsRouter.delete("/:id", requirePermission("products.delete"), asyncHandler(deleteProductController));
