import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { z } from "zod";
import type {
  accessQuerySchema,
  permissionCreateSchema,
  permissionUpdateSchema,
  roleCreateSchema,
  roleUpdateSchema,
} from "./access.schemas.js";

type AccessQuery = z.infer<typeof accessQuerySchema>;
type RoleCreate = z.infer<typeof roleCreateSchema>;
type RoleUpdate = z.infer<typeof roleUpdateSchema>;
type PermissionCreate = z.infer<typeof permissionCreateSchema>;
type PermissionUpdate = z.infer<typeof permissionUpdateSchema>;

export const listRoles = async (query: AccessQuery) => {
  return prisma.role.findMany({
    where: {
      ...(query.active ? { isActive: query.active === "true" } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: "insensitive" } },
              { name: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });
};

export const getRole = async (id: string) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });
  if (!role) throw new ApiError(404, "Rol no encontrado");
  return role;
};

const replaceRolePermissions = async (roleId: string, permissionIds: string[]) => {
  const uniqueIds = [...new Set(permissionIds)];

  if (uniqueIds.length) {
    const count = await prisma.permission.count({
      where: { id: { in: uniqueIds }, isActive: true },
    });
    if (count !== uniqueIds.length) {
      throw new ApiError(400, "Uno o más permisos no existen o están inactivos");
    }
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    ...(uniqueIds.length
      ? [
          prisma.rolePermission.createMany({
            data: uniqueIds.map((permissionId) => ({ roleId, permissionId })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
};

export const createRole = async (input: RoleCreate) => {
  const role = await prisma.role.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      isActive: input.isActive,
      isSystem: false,
    },
  });

  await replaceRolePermissions(role.id, input.permissionIds);
  return getRole(role.id);
};

export const updateRole = async (id: string, input: RoleUpdate) => {
  const role = await getRole(id);

  if (role.code === "ADMIN") {
    if (input.isActive === false) {
      throw new ApiError(400, "El rol ADMIN no puede ser desactivado");
    }
    if (input.permissionIds !== undefined) {
      throw new ApiError(
        400,
        "No se pueden modificar ni quitar los permisos del rol ADMIN",
      );
    }
  }

  if (role.isSystem && input.isActive === false) {
    throw new ApiError(400, "Los roles del sistema no pueden ser desactivados");
  }

  await prisma.role.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  if (input.permissionIds) {
    await replaceRolePermissions(role.id, input.permissionIds);
  }

  return getRole(id);
};

export const deleteRole = async (id: string) => {
  const role = await getRole(id);

  if (role.code === "ADMIN" || role.isSystem) {
    throw new ApiError(400, "Los roles del sistema no pueden eliminarse");
  }

  if (role._count.users > 0) {
    throw new ApiError(409, "No se puede eliminar un rol que tiene usuarios asignados");
  }

  await prisma.role.delete({ where: { id } });
  return { message: "Rol eliminado correctamente" };
};

export const listPermissions = async (query: AccessQuery) => {
  return prisma.permission.findMany({
    where: {
      ...(query.active ? { isActive: query.active === "true" } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: "insensitive" } },
              { name: { contains: query.search, mode: "insensitive" } },
              { module: { contains: query.search, mode: "insensitive" } },
              { action: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });
};

export const createPermission = async (input: PermissionCreate) => {
  return prisma.permission.create({ data: input });
};

export const updatePermission = async (id: string, input: PermissionUpdate) => {
  const found = await prisma.permission.findUnique({ where: { id } });
  if (!found) throw new ApiError(404, "Permiso no encontrado");
  return prisma.permission.update({ where: { id }, data: input });
};

export const deletePermission = async (id: string) => {
  const found = await prisma.permission.findUnique({ where: { id } });
  if (!found) throw new ApiError(404, "Permiso no encontrado");

  await prisma.permission.delete({ where: { id } });
  return { message: "Permiso eliminado correctamente" };
};
