import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import type {
  createSupplierSchema,
  suppliersQuerySchema,
  updateSupplierSchema,
} from "./suppliers.schemas.js";

type SuppliersQuery = z.infer<typeof suppliersQuerySchema>;
type CreateSupplier = z.infer<typeof createSupplierSchema>;
type UpdateSupplier = z.infer<typeof updateSupplierSchema>;

export const listSuppliers = async (query: SuppliersQuery) => {
  const { page, limit, search, active } = query;
  const { skip, take } = getPagination(page, limit);

  const where = {
    ...(active ? { isActive: active === "true" } : {}),
    ...(search
      ? {
          OR: [
            { rut: { contains: search, mode: "insensitive" as const } },
            { businessName: { contains: search, mode: "insensitive" as const } },
            { tradeName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.supplier.findMany({
      where,
      skip,
      take,
      orderBy: { businessName: "asc" },
    }),
    prisma.supplier.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const getSupplier = async (id: string) => {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) throw new ApiError(404, "Proveedor no encontrado");
  return supplier;
};

export const createSupplier = async (input: CreateSupplier) => {
  return prisma.supplier.create({ data: input });
};

export const updateSupplier = async (id: string, input: UpdateSupplier) => {
  await getSupplier(id);
  return prisma.supplier.update({ where: { id }, data: input });
};

export const deleteSupplier = async (id: string) => {
  await getSupplier(id);

  const [orders, batches] = await Promise.all([
    prisma.purchaseOrder.count({ where: { supplierId: id } }),
    prisma.batch.count({ where: { supplierId: id } }),
  ]);

  if (orders > 0 || batches > 0) {
    throw new ApiError(
      409,
      "El proveedor tiene movimientos asociados. Desactívalo en vez de eliminarlo.",
    );
  }

  await prisma.supplier.delete({ where: { id } });
  return { message: "Proveedor eliminado correctamente" };
};
