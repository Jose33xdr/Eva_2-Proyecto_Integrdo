import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePermission } from "../../middlewares/authorize.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as c from "./clinical.controller.js";

export const patientsRouter = Router();
patientsRouter.use(authenticate);
patientsRouter.get("/", requirePermission("patients.read"), asyncHandler(c.listPatients));
patientsRouter.get("/:id", requirePermission("patients.read"), asyncHandler(c.getPatient));
patientsRouter.post("/", requirePermission("patients.create"), asyncHandler(c.createPatient));
patientsRouter.patch("/:id", requirePermission("patients.update"), asyncHandler(c.updatePatient));
patientsRouter.delete("/:id", requirePermission("patients.delete"), asyncHandler(c.deletePatient));

export const doctorsRouter = Router();
doctorsRouter.use(authenticate);
doctorsRouter.get("/", requirePermission("prescriptions.read"), asyncHandler(c.listDoctors));
doctorsRouter.get("/:id", requirePermission("prescriptions.read"), asyncHandler(c.getDoctor));
doctorsRouter.post("/", requirePermission("prescriptions.create"), asyncHandler(c.createDoctor));
doctorsRouter.patch("/:id", requirePermission("doctors.update"), asyncHandler(c.updateDoctor));
doctorsRouter.delete("/:id", requirePermission("doctors.delete"), asyncHandler(c.deleteDoctor));

export const prescriptionsRouter = Router();
prescriptionsRouter.use(authenticate);
prescriptionsRouter.get("/", requirePermission("prescriptions.read"), asyncHandler(c.listPrescriptions));
prescriptionsRouter.get("/:id", requirePermission("prescriptions.read"), asyncHandler(c.getPrescription));
prescriptionsRouter.post("/", requirePermission("prescriptions.create"), asyncHandler(c.createPrescription));
prescriptionsRouter.post("/:id/cancel", requirePermission("prescriptions.cancel"), asyncHandler(c.cancelPrescription));
prescriptionsRouter.post("/dispensations/from-sale", requirePermission("prescriptions.dispense"), asyncHandler(c.createDispensation));

export const controlledRouter = Router();
controlledRouter.use(authenticate);
controlledRouter.get("/", requirePermission("controlled.read"), asyncHandler(c.listControlled));
controlledRouter.post("/", requirePermission("controlled.manage"), asyncHandler(c.createControlled));
