import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.js";
import { accessRouter } from "../modules/access/access.routes.js";
import { agreementsRouter } from "../modules/agreements/agreements.routes.js";
import {
  activeIngredientsRouter,
  categoriesRouter,
  laboratoriesRouter,
  productsRouter,
} from "../modules/catalog/catalog.routes.js";
import { cashRouter } from "../modules/cash/cash.routes.js";
import {
  controlledRouter,
  doctorsRouter,
  patientsRouter,
  prescriptionsRouter,
} from "../modules/clinical/clinical.routes.js";
import { inventoryRouter } from "../modules/inventory/inventory.routes.js";
import { purchasesRouter } from "../modules/purchases/purchases.routes.js";
import { reportsRouter } from "../modules/reports/reports.routes.js";
import { salesRouter } from "../modules/sales/sales.routes.js";
import { settingsRouter } from "../modules/settings/settings.routes.js";
import { suppliersRouter } from "../modules/suppliers/suppliers.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";
import { healthRouter } from "./health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);

apiRouter.use("/users", usersRouter);
apiRouter.use("/access", accessRouter);

apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/laboratories", laboratoriesRouter);
apiRouter.use("/active-ingredients", activeIngredientsRouter);
apiRouter.use("/products", productsRouter);

apiRouter.use("/suppliers", suppliersRouter);
apiRouter.use("/purchases", purchasesRouter);
apiRouter.use("/inventory", inventoryRouter);

apiRouter.use("/cash", cashRouter);
apiRouter.use("/sales", salesRouter);

apiRouter.use("/patients", patientsRouter);
apiRouter.use("/doctors", doctorsRouter);
apiRouter.use("/prescriptions", prescriptionsRouter);
apiRouter.use("/controlled-drugs", controlledRouter);

apiRouter.use("/agreements", agreementsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/settings", settingsRouter);
