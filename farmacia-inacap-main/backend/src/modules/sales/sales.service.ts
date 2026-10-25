import crypto from "node:crypto";
import type { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import type {
  cancelSaleSchema,
  checkoutSchema,
  issueTaxDocumentSchema,
  salesQuerySchema,
} from "./sales.schemas.js";

type CheckoutInput = z.infer<typeof checkoutSchema>;
type SalesQuery = z.infer<typeof salesQuerySchema>;
type CancelSaleInput = z.infer<typeof cancelSaleSchema>;
type IssueTaxDocumentInput = z.infer<typeof issueTaxDocumentSchema>;

const roundMoney = (value: number) => Math.round(value);
const asNumber = (value: unknown) => Number(value ?? 0);

const saleInclude = {
  seller: {
    select: { id: true, firstName: true, lastName: true, username: true },
  },
  patient: true,
  cashSession: {
    include: { cashRegister: true },
  },
  items: {
    include: {
      product: true,
      prescriptionItem: true,
      batchAllocations: {
        include: { batch: true },
      },
    },
  },
  payments: true,
  taxDocument: true,
  coverages: true,
} as const;

type FefoAllocation = {
  batchId: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  unitCost: number | null;
};

const allocateFefo = async (
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
  locationId?: string | null,
): Promise<FefoAllocation[]> => {
  const stocks = await tx.inventoryStock.findMany({
    where: {
      ...(locationId ? { locationId } : {}),
      quantity: { gt: 0 },
      location: { isActive: true, type: { not: "QUARANTINE" } },
      batch: {
        productId,
        isBlocked: false,
        expirationDate: { gt: new Date() },
      },
    },
    include: {
      batch: true,
    },
    orderBy: {
      batch: {
        expirationDate: "asc",
      },
    },
  });

  let remaining = quantity;
  const allocations: FefoAllocation[] = [];

  for (const stock of stocks) {
    if (remaining <= 0) break;

    const reservedQty = Number(stock.reservedQuantity);
    const available = Math.max(0, Number(stock.quantity) - reservedQty);

    if (available <= 0) continue;

    const allocated = Math.min(available, remaining);

    allocations.push({
      batchId: stock.batchId,
      locationId: stock.locationId,
      quantity: allocated,
      reservedQuantity: reservedQty,
      unitCost:
        stock.batch.purchasePrice === null
          ? null
          : Number(stock.batch.purchasePrice),
    });

    remaining -= allocated;
  }

  if (remaining > 0) {
    throw new ApiError(409, "Stock disponible insuficiente para completar la venta");
  }

  return allocations;
};

export const listSales = async (query: SalesQuery) => {
  const { page, limit, search, status, sellerId, patientId, cashSessionId, from, to } =
    query;
  const { skip, take } = getPagination(page, limit);

  const where = {
    ...(status ? { status } : {}),
    ...(sellerId ? { sellerId } : {}),
    ...(patientId ? { patientId } : {}),
    ...(cashSessionId ? { cashSessionId } : {}),
    ...(from || to
      ? {
          saleDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { customerRut: { contains: search, mode: "insensitive" as const } },
            { customerName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.sale.findMany({
      where,
      include: saleInclude,
      skip,
      take,
      orderBy: { saleDate: "desc" },
    }),
    prisma.sale.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const getSale = async (id: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: saleInclude,
  });

  if (!sale) throw new ApiError(404, "Venta no encontrada");
  return sale;
};

export const checkout = async (sellerId: string, input: CheckoutInput) => {
  if (
    input.taxDocumentType === "INVOICE" &&
    (!input.customerRut ||
      !input.customerBusinessName ||
      !input.customerBusinessActivity ||
      !input.customerAddress)
  ) {
    throw new ApiError(
      400,
      "Para factura se requieren RUT, razón social, giro y dirección",
    );
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.findUnique({
      where: { id: input.cashSessionId },
    });

    if (!session || session.status !== "OPEN") {
      throw new ApiError(409, "Debe existir una sesión de caja abierta");
    }

    if (input.patientId) {
      const patient = await tx.patient.findUnique({
        where: { id: input.patientId },
      });

      if (!patient || !patient.isActive) {
        throw new ApiError(400, "Paciente inexistente o inactivo");
      }
    }

    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new ApiError(400, "Uno o más productos no existen o están inactivos");
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    const requestedByPrescriptionItem = new Map<string, number>();
    for (const item of input.items) {
      if (item.prescriptionItemId) {
        requestedByPrescriptionItem.set(
          item.prescriptionItemId,
          (requestedByPrescriptionItem.get(item.prescriptionItemId) ?? 0) +
            item.quantity,
        );
      }
    }

    const prescriptionItemIds = [...requestedByPrescriptionItem.keys()];
    const prescriptionItemsList = prescriptionItemIds.length
      ? await tx.prescriptionItem.findMany({
          where: { id: { in: prescriptionItemIds } },
          include: { prescription: true },
        })
      : [];
    const prescriptionItemMap = new Map(
      prescriptionItemsList.map((rxItem) => [rxItem.id, rxItem]),
    );

    type PreparedSaleItem = {
      productId: string;
      quantity: number;
      discountAmount: number;
      prescriptionItemId?: string | null;
      locationId?: string | null;
      product: {
        id: string;
        name: string;
        salePrice: unknown;
        requiresPrescription: boolean;
        isControlled: boolean;
      };
      unitPrice: number;
      lineGross: number;
      lineNet: number;
      lineTax: number;
      lineTotal: number;
    };

    const preparedItems: PreparedSaleItem[] = [];

    let subtotal = 0;
    let discountAmount = 0;
    let totalAmount = 0;
    let exactNetSum = 0;
    let exactTaxSum = 0;
    const divisor = 1 + input.taxRate / 100;

    for (const item of input.items) {
      const product = productMap.get(item.productId)!;

      if (
        (product.requiresPrescription || product.isControlled) &&
        !item.prescriptionItemId
      ) {
        throw new ApiError(
          400,
          `${product.name} requiere una receta válida`,
        );
      }

      if (item.prescriptionItemId) {
        const prescriptionItem = prescriptionItemMap.get(item.prescriptionItemId);

        if (!prescriptionItem || prescriptionItem.productId !== product.id) {
          throw new ApiError(400, "El ítem de receta no corresponde al producto");
        }

        if (
          !input.patientId ||
          input.patientId !== prescriptionItem.prescription.patientId
        ) {
          throw new ApiError(
            400,
            "La receta médica no pertenece al paciente de la venta",
          );
        }

        if (
          prescriptionItem.prescription.status !== "ACTIVE" &&
          prescriptionItem.prescription.status !== "PARTIALLY_DISPENSED"
        ) {
          throw new ApiError(
            409,
            "La receta no se encuentra disponible para dispensación",
          );
        }

        if (
          prescriptionItem.prescription.expirationDate &&
          prescriptionItem.prescription.expirationDate <= new Date()
        ) {
          throw new ApiError(409, "La receta está vencida");
        }

        const totalRequested =
          requestedByPrescriptionItem.get(item.prescriptionItemId) ?? item.quantity;

        if (prescriptionItem.remainingQuantity < totalRequested) {
          throw new ApiError(409, "La receta no tiene saldo suficiente");
        }
      }

      const unitPrice = asNumber(product.salePrice);
      const lineGross = roundMoney(unitPrice * item.quantity);

      if (item.discountAmount > lineGross) {
        throw new ApiError(
          400,
          `El descuento de ${product.name} supera el total de la línea`,
        );
      }

      const lineTotal = roundMoney(lineGross - item.discountAmount);
      const exactLineNet = lineTotal / divisor;
      const exactLineTax = lineTotal - exactLineNet;
      const lineNet = roundMoney(exactLineNet);
      const lineTax = roundMoney(lineTotal - lineNet);

      subtotal += lineGross;
      discountAmount += item.discountAmount;
      totalAmount += lineTotal;
      exactNetSum += exactLineNet;
      exactTaxSum += exactLineTax;

      preparedItems.push({
        ...item,
        product,
        unitPrice,
        lineGross,
        lineNet,
        lineTax,
        lineTotal,
      });
    }

    subtotal = roundMoney(subtotal);
    discountAmount = roundMoney(discountAmount);
    totalAmount = roundMoney(totalAmount);

    const netAmount = roundMoney(exactNetSum);
    const taxAmount =
      netAmount + roundMoney(exactTaxSum) === totalAmount
        ? roundMoney(exactTaxSum)
        : roundMoney(totalAmount - netAmount);

    const paymentsTotal = roundMoney(
      input.payments.reduce((sum, payment) => sum + payment.amount, 0),
    );

    if (paymentsTotal !== totalAmount) {
      throw new ApiError(
        400,
        `Los pagos (${paymentsTotal}) deben coincidir con el total de la venta (${totalAmount})`,
      );
    }

    const sale = await tx.sale.create({
      data: {
        code: input.code,
        status: "DRAFT",
        sellerId,
        patientId: input.patientId ?? null,
        cashSessionId: input.cashSessionId,
        customerRut: input.customerRut ?? null,
        customerName: input.customerName ?? null,
        customerBusinessName: input.customerBusinessName ?? null,
        customerBusinessActivity: input.customerBusinessActivity ?? null,
        customerAddress: input.customerAddress ?? null,
        subtotal,
        discountAmount,
        coverageAmount: 0,
        netAmount,
        taxAmount,
        totalAmount,
        notes: input.notes ?? null,
      },
    });

    for (const item of preparedItems) {
      const allocations = await allocateFefo(
        tx,
        item.productId,
        item.quantity,
        item.locationId,
      );

      const saleItem = await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          prescriptionItemId: item.prescriptionItemId ?? null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          netAmount: item.lineNet,
          taxAmount: item.lineTax,
          totalAmount: item.lineTotal,
        },
      });

      const batchTotals = new Map<string, number>();

      for (const allocation of allocations) {
        const stockBeforeAgg = item.product.isControlled
          ? await tx.inventoryStock.aggregate({
              where: { batchId: allocation.batchId },
              _sum: { quantity: true },
            })
          : null;
        const balanceBefore = Number(stockBeforeAgg?._sum.quantity ?? 0);

        const updatedStock = await tx.inventoryStock.updateMany({
          where: {
            batchId: allocation.batchId,
            locationId: allocation.locationId,
            quantity: {
              gte: allocation.quantity + allocation.reservedQuantity,
            },
          },
          data: {
            quantity: { decrement: allocation.quantity },
          },
        });

        if (updatedStock.count === 0) {
          throw new ApiError(
            409,
            "Conflicto de concurrencia: el stock del lote fue consumido por otra transacción simultánea.",
          );
        }

        const postStock = await tx.inventoryStock.findUnique({
          where: {
            batchId_locationId: {
              batchId: allocation.batchId,
              locationId: allocation.locationId,
            },
          },
        });

        if (!postStock || postStock.quantity - postStock.reservedQuantity < 0) {
          throw new ApiError(
            409,
            "Stock disponible insuficiente considerando unidades reservadas.",
          );
        }

        await tx.inventoryMovement.create({
          data: {
            type: "SALE",
            productId: item.productId,
            batchId: allocation.batchId,
            originLocationId: allocation.locationId,
            quantity: allocation.quantity,
            unitCost: allocation.unitCost,
            referenceType: "SALE",
            referenceId: sale.id,
            reason: `Venta ${input.code}`,
            userId: sellerId,
          },
        });

        if (item.product.isControlled && item.prescriptionItemId) {
          const rxItem = prescriptionItemMap.get(item.prescriptionItemId);
          const stockAfterAgg = await tx.inventoryStock.aggregate({
            where: { batchId: allocation.batchId },
            _sum: { quantity: true },
          });
          const balanceAfter = Number(stockAfterAgg._sum.quantity ?? 0);

          if (rxItem) {
            await tx.controlledDrugRecord.create({
              data: {
                recordNumber: `CTRL-${crypto.randomUUID()}`,
                movementType: "DISPENSATION",
                productId: item.product.id,
                batchId: allocation.batchId,
                prescriptionId: rxItem.prescriptionId,
                saleId: sale.id,
                patientId: rxItem.prescription.patientId,
                doctorId: rxItem.prescription.doctorId,
                quantity: allocation.quantity,
                balanceBefore,
                balanceAfter,
                prescriptionFolio: rxItem.prescription.folio,
                userId: sellerId,
              },
            });
          }
        }

        batchTotals.set(
          allocation.batchId,
          (batchTotals.get(allocation.batchId) ?? 0) + allocation.quantity,
        );
      }

      for (const [batchId, quantity] of batchTotals.entries()) {
        await tx.saleItemBatch.create({
          data: {
            saleItemId: saleItem.id,
            batchId,
            quantity,
          },
        });
      }
    }

    const updatedPrescriptionIds = new Set<string>();

    for (const [prescriptionItemId, totalQty] of requestedByPrescriptionItem.entries()) {
      const updatedRx = await tx.prescriptionItem.updateMany({
        where: {
          id: prescriptionItemId,
          remainingQuantity: { gte: totalQty },
        },
        data: {
          dispensedQuantity: { increment: totalQty },
          remainingQuantity: { decrement: totalQty },
        },
      });

      if (updatedRx.count === 0) {
        throw new ApiError(409, "La receta no tiene saldo suficiente");
      }

      const rxItem = prescriptionItemMap.get(prescriptionItemId);
      if (rxItem) {
        updatedPrescriptionIds.add(rxItem.prescriptionId);
      }
    }

    for (const prescriptionId of updatedPrescriptionIds) {
      const prescriptionItems = await tx.prescriptionItem.findMany({
        where: { prescriptionId },
      });

      const allDispensed = prescriptionItems.every(
        (rxItem) => rxItem.remainingQuantity <= 0,
      );
      const anyDispensed = prescriptionItems.some(
        (rxItem) => rxItem.dispensedQuantity > 0,
      );

      await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: allDispensed
            ? "DISPENSED"
            : anyDispensed
              ? "PARTIALLY_DISPENSED"
              : "ACTIVE",
        },
      });
    }

    for (const payment of input.payments) {
      await tx.payment.create({
        data: {
          saleId: sale.id,
          method: payment.method,
          amount: payment.amount,
          referenceCode: payment.referenceCode ?? null,
        },
      });
    }

    const cashPaid = roundMoney(
      input.payments
        .filter((payment) => payment.method === "CASH")
        .reduce((sum, payment) => sum + payment.amount, 0),
    );

    if (cashPaid > 0) {
      await tx.cashMovement.create({
        data: {
          cashSessionId: input.cashSessionId,
          type: "SALE",
          amount: cashPaid,
          description: `Venta ${input.code}`,
          saleId: sale.id,
          userId: sellerId,
        },
      });
    }

    await tx.taxDocument.create({
      data: {
        saleId: sale.id,
        type: input.taxDocumentType,
        status: "PENDING",
      },
    });

    await tx.sale.update({
      where: { id: sale.id },
      data: { status: "COMPLETED" },
    });

    return tx.sale.findUnique({
      where: { id: sale.id },
      include: saleInclude,
    });
  });
};

export const cancelSale = async (
  saleId: string,
  userId: string,
  input: CancelSaleInput,
) => {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: saleInclude,
    });

    if (!sale) throw new ApiError(404, "Venta no encontrada");

    const updatedSale = await tx.sale.updateMany({
      where: { id: saleId, status: "COMPLETED" },
      data: {
        status: "CANCELLED",
        notes: sale.notes
          ? `${sale.notes}\nANULACIÓN: ${input.reason}`
          : `ANULACIÓN: ${input.reason}`,
      },
    });

    if (updatedSale.count === 0) {
      throw new ApiError(409, "Solo se pueden anular ventas completadas");
    }

    const cashPaid = roundMoney(
      sale.payments
        .filter((payment) => payment.method === "CASH")
        .reduce((sum, payment) => sum + asNumber(payment.amount), 0),
    );

    if (cashPaid > 0) {
      if (!sale.cashSession || sale.cashSession.status === "CLOSED" || sale.cashSession.status !== "OPEN") {
        throw new ApiError(
          409,
          "No se puede anular una venta con pago en efectivo porque la sesión de caja asociada está cerrada",
        );
      }
    }

    const saleMovements = await tx.inventoryMovement.findMany({
      where: {
        type: "SALE",
        referenceType: "SALE",
        referenceId: saleId,
      },
    });

    for (const movement of saleMovements) {
      if (!movement.originLocationId) continue;

      const saleItemForProduct = sale.items.find(
        (si) => si.productId === movement.productId,
      );
      const originalCtrl = await tx.controlledDrugRecord.findFirst({
        where: {
          saleId,
          productId: movement.productId,
          batchId: movement.batchId,
          movementType: "DISPENSATION",
        },
      });
      const isControlledMove = Boolean(
        originalCtrl || saleItemForProduct?.product.isControlled,
      );

      const stockBeforeAgg = isControlledMove
        ? await tx.inventoryStock.aggregate({
            where: { batchId: movement.batchId },
            _sum: { quantity: true },
          })
        : null;
      const balanceBefore = Number(stockBeforeAgg?._sum.quantity ?? 0);

      await tx.inventoryStock.upsert({
        where: {
          batchId_locationId: {
            batchId: movement.batchId,
            locationId: movement.originLocationId,
          },
        },
        update: {
          quantity: { increment: movement.quantity },
        },
        create: {
          batchId: movement.batchId,
          locationId: movement.originLocationId,
          quantity: movement.quantity,
          reservedQuantity: 0,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          type: "CUSTOMER_RETURN",
          productId: movement.productId,
          batchId: movement.batchId,
          destinationLocationId: movement.originLocationId,
          quantity: movement.quantity,
          unitCost: movement.unitCost,
          referenceType: "SALE_CANCELLATION",
          referenceId: saleId,
          reason: input.reason,
          userId,
        },
      });

      if (isControlledMove) {
        const stockAfterAgg = await tx.inventoryStock.aggregate({
          where: { batchId: movement.batchId },
          _sum: { quantity: true },
        });
        const balanceAfter = Number(stockAfterAgg._sum.quantity ?? 0);

        if (originalCtrl && originalCtrl.status !== "CANCELLED") {
          await tx.controlledDrugRecord.update({
            where: { id: originalCtrl.id },
            data: { status: "CANCELLED" },
          });
        }

        await tx.controlledDrugRecord.create({
          data: {
            recordNumber: `CTRL-${crypto.randomUUID()}`,
            movementType: "RETURN",
            status: "ACTIVE",
            productId: movement.productId,
            batchId: movement.batchId,
            prescriptionId: originalCtrl?.prescriptionId ?? null,
            dispensationId: originalCtrl?.dispensationId ?? null,
            saleId,
            patientId: originalCtrl?.patientId ?? sale.patientId ?? null,
            doctorId: originalCtrl?.doctorId ?? null,
            quantity: movement.quantity,
            balanceBefore,
            balanceAfter,
            prescriptionFolio: originalCtrl?.prescriptionFolio ?? null,
            reason: `Anulación venta ${sale.code}: ${input.reason}`,
            userId,
          },
        });
      }
    }

    for (const item of sale.items) {
      if (!item.prescriptionItemId) continue;

      await tx.prescriptionItem.update({
        where: { id: item.prescriptionItemId },
        data: {
          dispensedQuantity: { decrement: item.quantity },
          remainingQuantity: { increment: item.quantity },
        },
      });
    }

    const prescriptionIds = [
      ...new Set(
        sale.items
          .map((item) => item.prescriptionItem?.prescriptionId)
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    for (const prescriptionId of prescriptionIds) {
      const items = await tx.prescriptionItem.findMany({
        where: { prescriptionId },
      });

      const allDispensed = items.every((item) => item.remainingQuantity <= 0);
      const anyDispensed = items.some((item) => item.dispensedQuantity > 0);

      await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: allDispensed
            ? "DISPENSED"
            : anyDispensed
              ? "PARTIALLY_DISPENSED"
              : "ACTIVE",
        },
      });
    }

    if (cashPaid > 0 && sale.cashSessionId) {
      await tx.cashMovement.create({
        data: {
          cashSessionId: sale.cashSessionId,
          type: "REFUND",
          amount: cashPaid,
          description: `Anulación venta ${sale.code}: ${input.reason}`,
          saleId,
          userId,
        },
      });
    }

    if (sale.taxDocument) {
      await tx.taxDocument.update({
        where: { saleId },
        data: {
          status: "CANCELLED",
          siiResponse: `Documento anulado localmente: ${input.reason}`,
        },
      });
    }

    return tx.sale.findUniqueOrThrow({
      where: { id: saleId },
      include: saleInclude,
    });
  });
};

export const issueTaxDocumentMock = async (
  saleId: string,
  input: IssueTaxDocumentInput,
) => {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { taxDocument: true },
  });

  if (!sale) throw new ApiError(404, "Venta no encontrada");
  if (sale.status !== "COMPLETED") {
    throw new ApiError(409, "La venta debe estar completada");
  }
  if (!sale.taxDocument) {
    throw new ApiError(404, "La venta no tiene documento tributario");
  }
  if (sale.taxDocument.status === "CANCELLED") {
    throw new ApiError(409, "El documento está anulado");
  }

  const folio =
    input.folio ??
    `MOCK-${Date.now().toString().slice(-10)}`;

  return prisma.taxDocument.update({
    where: { saleId },
    data: {
      status: "ISSUED",
      folio,
      siiTrackId: `LOCAL-${sale.id.slice(0, 8).toUpperCase()}`,
      siiResponse:
        "Emisión simulada para ambiente académico. Integración SII real pendiente.",
      issuedAt: new Date(),
    },
  });
};
