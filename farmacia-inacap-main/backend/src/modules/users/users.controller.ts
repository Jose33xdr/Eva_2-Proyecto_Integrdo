import type { Request, Response } from "express";
import {
  createUserSchema,
  updateUserSchema,
  usersQuerySchema,
} from "./users.schemas.js";
import * as service from "./users.service.js";
import { ApiError } from "../../utils/ApiError.js";

const getIdParam = (req: Request) => {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new ApiError(400, "ID inválido");
  }

  return id;
};

export const listUsersController = async (req: Request, res: Response) => {
  const query = usersQuerySchema.parse(req.query);

  res.json({
    ok: true,
    ...(await service.listUsers(query)),
  });
};

export const getUserController = async (req: Request, res: Response) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    user: await service.getUser(id),
  });
};

export const createUserController = async (req: Request, res: Response) => {
  const input = createUserSchema.parse(req.body);

  res.status(201).json({
    ok: true,
    user: await service.createUser(input),
  });
};

export const updateUserController = async (req: Request, res: Response) => {
  const id = getIdParam(req);
  const input = updateUserSchema.parse(req.body);

  res.json({
    ok: true,
    user: await service.updateUser(id, input),
  });
};

export const deleteUserController = async (req: Request, res: Response) => {
  const id = getIdParam(req);

  res.json({
    ok: true,
    ...(await service.deleteUser(id, req.auth!.sub)),
  });
};