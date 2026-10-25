import type { Request, Response } from "express";
import {
  accessQuerySchema,
  permissionCreateSchema,
  permissionUpdateSchema,
  roleCreateSchema,
  roleUpdateSchema,
} from "./access.schemas.js";
import * as service from "./access.service.js";
import { ApiError } from "../../utils/ApiError.js";

const getIdParam = (req: Request) => {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new ApiError(400, "ID inválido");
  }

  return id;
};

export const listRolesController = async (req: Request, res: Response) => {
  res.json({
    ok: true,
    roles: await service.listRoles(accessQuerySchema.parse(req.query)),
  });
};

export const getRoleController = async (req: Request, res: Response) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    role: await service.getRole(id),
  });
};

export const createRoleController = async (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    role: await service.createRole(roleCreateSchema.parse(req.body)),
  });
};

export const updateRoleController = async (req: Request, res: Response) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    role: await service.updateRole(
      id,
      roleUpdateSchema.parse(req.body),
    ),
  });
};

export const deleteRoleController = async (req: Request, res: Response) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    ...(await service.deleteRole(id)),
  });
};

export const listPermissionsController = async (
  req: Request,
  res: Response,
) => {
  res.json({
    ok: true,
    permissions: await service.listPermissions(
      accessQuerySchema.parse(req.query),
    ),
  });
};

export const createPermissionController = async (
  req: Request,
  res: Response,
) => {
  res.status(201).json({
    ok: true,
    permission: await service.createPermission(
      permissionCreateSchema.parse(req.body),
    ),
  });
};

export const updatePermissionController = async (
  req: Request,
  res: Response,
) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    permission: await service.updatePermission(
      id,
      permissionUpdateSchema.parse(req.body),
    ),
  });
};

export const deletePermissionController = async (
  req: Request,
  res: Response,
) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    ...(await service.deletePermission(id)),
  });
};