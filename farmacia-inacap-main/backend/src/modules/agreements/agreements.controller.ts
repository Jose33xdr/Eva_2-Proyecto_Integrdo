import type { Request, Response } from "express";
import { getRouteParam } from "../../utils/routeParam.js";
import * as service from "./agreements.service.js";
import {
  agreementCreateSchema,
  agreementsQuerySchema,
  agreementUpdateSchema,
  applyCoverageSchema,
  benefitCreateSchema,
  benefitUpdateSchema,
  patientCoverageCreateSchema,
  planCreateSchema,
  planUpdateSchema,
  previewCoverageSchema,
} from "./agreements.schemas.js";

export const list = async (req: Request, res: Response) =>
  res.json({ ok: true, agreements: await service.listAgreements(agreementsQuerySchema.parse(req.query)) });

export const get = async (req: Request, res: Response) =>
  res.json({ ok: true, agreement: await service.getAgreement(getRouteParam(req, "id")) });

export const create = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, agreement: await service.createAgreement(agreementCreateSchema.parse(req.body)) });

export const update = async (req: Request, res: Response) =>
  res.json({ ok: true, agreement: await service.updateAgreement(getRouteParam(req, "id"), agreementUpdateSchema.parse(req.body)) });

export const createPlan = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, plan: await service.createPlan(getRouteParam(req, "id"), planCreateSchema.parse(req.body)) });

export const updatePlan = async (req: Request, res: Response) =>
  res.json({ ok: true, plan: await service.updatePlan(getRouteParam(req, "planId"), planUpdateSchema.parse(req.body)) });

export const createBenefit = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, benefit: await service.createBenefit(getRouteParam(req, "planId"), benefitCreateSchema.parse(req.body)) });

export const updateBenefit = async (req: Request, res: Response) =>
  res.json({ ok: true, benefit: await service.updateBenefit(getRouteParam(req, "benefitId"), benefitUpdateSchema.parse(req.body)) });

export const createCoverage = async (req: Request, res: Response) =>
  res.status(201).json({ ok: true, coverage: await service.createPatientCoverage(patientCoverageCreateSchema.parse(req.body)) });

export const preview = async (req: Request, res: Response) =>
  res.json({ ok: true, preview: await service.previewCoverage(previewCoverageSchema.parse(req.body)) });

export const apply = async (req: Request, res: Response) =>
  res.json({ ok: true, coverage: await service.applyCoverageToSale(getRouteParam(req, "saleId"), applyCoverageSchema.parse(req.body)) });
