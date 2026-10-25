import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import type { auditQuerySchema, periodQuerySchema } from "./reports.schemas.js";

type Period = z.infer<typeof periodQuerySchema>;
type AuditQuery = z.infer<typeof auditQuerySchema>;

const range = (period: Period) =>
  period.from || period.to
    ? {
        ...(period.from ? { gte: period.from } : {}),
        ...(period.to ? { lte: period.to } : {}),
      }
    : undefined;

export const dashboard = async () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDays = new Date(now.getTime() + 30 * 86400000);

  const [
    todaySales,
    todayRevenue,
    activeProducts,
    activePatients,
    lowStockProducts,
    expiringBatches,
    openCashSessions,
    activePrescriptions,
    pendingAlerts,
  ] = await Promise.all([
    prisma.sale.count({
      where: { status: "COMPLETED", saleDate: { gte: today } },
    }),
    prisma.sale.aggregate({
      where: { status: "COMPLETED", saleDate: { gte: today } },
      _sum: { totalAmount: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.patient.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        minimumStock: true,
        batches: {
          where: {
            isBlocked: false,
            expirationDate: { gt: now },
          },
          select: {
            stocks: {
              where: {
                location: {
                  isActive: true,
                  type: { not: "QUARANTINE" },
                },
              },
              select: { quantity: true, reservedQuantity: true },
            },
          },
        },
      },
    }),
    prisma.batch.count({
      where: {
        isBlocked: false,
        expirationDate: { gt: now, lte: thirtyDays },
        stocks: {
          some: {
            quantity: { gt: 0 },
            location: {
              isActive: true,
              type: { not: "QUARANTINE" },
            },
          },
        },
      },
    }),
    prisma.cashSession.count({ where: { status: "OPEN" } }),
    prisma.prescription.count({
      where: { status: { in: ["ACTIVE", "PARTIALLY_DISPENSED"] } },
    }),
    prisma.alert.count({ where: { status: "PENDING" } }),
  ]);

  const lowStock = lowStockProducts
    .map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      minimumStock: product.minimumStock,
      stock: product.batches.reduce(
        (sum, batch) =>
          sum +
          batch.stocks.reduce(
            (inner, stock) =>
              inner + Math.max(0, stock.quantity - stock.reservedQuantity),
            0,
          ),
        0,
      ),
    }))
    .filter((product) => product.stock <= product.minimumStock);

  return {
    today: {
      sales: todaySales,
      revenue: Number(todayRevenue._sum.totalAmount ?? 0),
    },
    counters: {
      activeProducts,
      activePatients,
      lowStock: lowStock.length,
      expiringBatches,
      openCashSessions,
      activePrescriptions,
      pendingAlerts,
    },
    lowStock: lowStock.slice(0, 10),
  };
};

export const salesReport = async (period: Period) => {
  const dateRange = range(period);
  const sales = await prisma.sale.findMany({
    where: {
      status: "COMPLETED",
      ...(dateRange ? { saleDate: dateRange } : {}),
    },
    include: {
      seller: { select: { username: true, firstName: true, lastName: true } },
      patient: { select: { rut: true, firstName: true, lastName: true } },
      payments: true,
      coverages: true,
      _count: { select: { items: true } },
    },
    orderBy: { saleDate: "desc" },
  });

  return {
    summary: {
      count: sales.length,
      total: sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
      discounts: sales.reduce((sum, sale) => sum + Number(sale.discountAmount), 0),
      coverages: sales.reduce((sum, sale) => sum + Number(sale.coverageAmount), 0),
    },
    sales,
  };
};

export const inventoryReport = async () => {
  const now = new Date();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      laboratory: true,
      batches: {
        include: { stocks: { include: { location: true } } },
        orderBy: { expirationDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map((product) => {
    const stock = product.batches.reduce((sum, batch) => {
      if (batch.isBlocked || batch.expirationDate <= now) {
        return sum;
      }
      return (
        sum +
        batch.stocks.reduce((inner, item) => {
          if (!item.location.isActive || item.location.type === "QUARANTINE") {
            return inner;
          }
          return inner + Math.max(0, item.quantity - item.reservedQuantity);
        }, 0)
      );
    }, 0);

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category.name,
      laboratory: product.laboratory?.name ?? null,
      minimumStock: product.minimumStock,
      stock,
      lowStock: stock <= product.minimumStock,
      batches: product.batches,
    };
  });
};

export const purchasesReport = async (period: Period) => {
  const dateRange = range(period);
  const orders = await prisma.purchaseOrder.findMany({
    where: dateRange ? { orderDate: dateRange } : {},
    include: { supplier: true, details: { include: { product: true } } },
    orderBy: { orderDate: "desc" },
  });

  return {
    count: orders.length,
    total: orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    orders,
  };
};

export const cashReport = async (period: Period) => {
  const dateRange = range(period);
  return prisma.cashSession.findMany({
    where: dateRange ? { openedAt: dateRange } : {},
    include: {
      cashRegister: true,
      openedBy: { select: { username: true, firstName: true, lastName: true } },
      closedBy: { select: { username: true, firstName: true, lastName: true } },
      movements: true,
      _count: { select: { sales: true } },
    },
    orderBy: { openedAt: "desc" },
  });
};

export const controlledReport = async (period: Period) => {
  const dateRange = range(period);
  return prisma.controlledDrugRecord.findMany({
    where: dateRange ? { occurredAt: dateRange } : {},
    include: {
      product: true,
      batch: true,
      patient: true,
      doctor: true,
      prescription: true,
      user: { select: { username: true, firstName: true, lastName: true } },
    },
    orderBy: { occurredAt: "desc" },
  });
};

export const auditLogs = async (query: AuditQuery) => {
  const { page, limit, module, action, userId, from, to } = query;
  const { skip, take } = getPagination(page, limit);

  const where = {
    ...(module ? { module } : {}),
    ...(action ? { action } : {}),
    ...(userId ? { userId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};
