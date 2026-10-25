import type { Request, Response } from "express";
import { getRouteParam } from "../../utils/routeParam.js";
import * as service from "./clinical.service.js";
import {
  cancelPrescriptionSchema,
  controlledManualSchema,
  controlledQuerySchema,
  dispensationFromSaleSchema,
  doctorCreateSchema,
  doctorsQuerySchema,
  doctorUpdateSchema,
  patientCreateSchema,
  patientsQuerySchema,
  patientUpdateSchema,
  prescriptionCreateSchema,
  prescriptionsQuerySchema,
} from "./clinical.schemas.js";

export const listPatients = async (req: Request, res: Response) =>
  res.json({ ok: true, ...(await service.listPatients(patientsQuerySchema.parse(req.query))) });

export const getPatient = async (req: Request, res: Response) =>
  res.json({ ok: true, patient: await service.getPatient(getRouteParam(req, "id")) });

export const createPatient = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, patient: await service.createPatient(patientCreateSchema.parse(req.body)) });

export const updatePatient = async (req: Request, res: Response) =>
  res.json({ ok: true, patient: await service.updatePatient(getRouteParam(req, "id"), patientUpdateSchema.parse(req.body)) });

export const deletePatient = async (req: Request, res: Response) =>
  res.json({ ok: true, result: await service.deletePatient(getRouteParam(req, "id")) });

export const listDoctors = async (req: Request, res: Response) =>
  res.json({ ok: true, ...(await service.listDoctors(doctorsQuerySchema.parse(req.query))) });

export const getDoctor = async (req: Request, res: Response) =>
  res.json({ ok: true, doctor: await service.getDoctor(getRouteParam(req, "id")) });

export const createDoctor = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, doctor: await service.createDoctor(doctorCreateSchema.parse(req.body)) });

export const updateDoctor = async (req: Request, res: Response) =>
  res.json({ ok: true, doctor: await service.updateDoctor(getRouteParam(req, "id"), doctorUpdateSchema.parse(req.body)) });

export const deleteDoctor = async (req: Request, res: Response) =>
  res.json({ ok: true, result: await service.deleteDoctor(getRouteParam(req, "id")) });

export const listPrescriptions = async (req: Request, res: Response) =>
  res.json({ ok: true, ...(await service.listPrescriptions(prescriptionsQuerySchema.parse(req.query))) });

export const getPrescription = async (req: Request, res: Response) =>
  res.json({ ok: true, prescription: await service.getPrescription(getRouteParam(req, "id")) });

export const createPrescription = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, prescription: await service.createPrescription(prescriptionCreateSchema.parse(req.body)) });

export const cancelPrescription = async (req: Request, res: Response) =>
  res.json({ ok: true, prescription: await service.cancelPrescription(getRouteParam(req, "id"), cancelPrescriptionSchema.parse(req.body)) });

export const createDispensation = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, dispensation: await service.createDispensationFromSale(req.auth!.sub, dispensationFromSaleSchema.parse(req.body)) });

export const listControlled = async (req: Request, res: Response) =>
  res.json({ ok: true, ...(await service.listControlledRecords(controlledQuerySchema.parse(req.query))) });

export const createControlled = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, record: await service.createManualControlledRecord(req.auth!.sub, controlledManualSchema.parse(req.body)) });
