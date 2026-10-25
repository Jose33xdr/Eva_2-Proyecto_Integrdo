import crypto from "node:crypto";
import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import type {
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

type PatientsQuery = z.infer<typeof patientsQuerySchema>;
type PatientCreate = z.infer<typeof patientCreateSchema>;
type PatientUpdate = z.infer<typeof patientUpdateSchema>;
type DoctorsQuery = z.infer<typeof doctorsQuerySchema>;
type DoctorCreate = z.infer<typeof doctorCreateSchema>;
type DoctorUpdate = z.infer<typeof doctorUpdateSchema>;
type PrescriptionCreate = z.infer<typeof prescriptionCreateSchema>;
type PrescriptionsQuery = z.infer<typeof prescriptionsQuerySchema>;
type CancelPrescription = z.infer<typeof cancelPrescriptionSchema>;
type DispensationFromSale = z.infer<typeof dispensationFromSaleSchema>;
type ControlledQuery = z.infer<typeof controlledQuerySchema>;
type ControlledManual = z.infer<typeof controlledManualSchema>;

const personSearch = (search?: string) =>
  search
    ? {
        OR: [
          { rut: { contains: search, mode: "insensitive" as const } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

export const listPatients = async (query: PatientsQuery) => {
  const { page, limit, search, active } = query;
  const { skip, take } = getPagination(page, limit);
  const where = {
    ...(active ? { isActive: active === "true" } : {}),
    ...personSearch(search),
  };

  const [items, total] = await prisma.$transaction([
    prisma.patient.findMany({
      where,
      skip,
      take,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: { _count: { select: { prescriptions: true, sales: true, coverages: true } } },
    }),
    prisma.patient.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const getPatient = async (id: string) => {
  const item = await prisma.patient.findUnique({
    where: { id },
    include: {
      coverages: {
        include: { agreementPlan: { include: { agreement: true } } },
      },
      _count: { select: { prescriptions: true, sales: true } },
    },
  });
  if (!item) throw new ApiError(404, "Paciente no encontrado");
  return item;
};

export const createPatient = (input: PatientCreate) =>
  prisma.patient.create({ data: input });

export const updatePatient = async (id: string, input: PatientUpdate) => {
  await getPatient(id);
  return prisma.patient.update({ where: { id }, data: input });
};

export const deletePatient = async (id: string) => {
  const patient = await getPatient(id);
  if (patient._count.prescriptions > 0 || patient._count.sales > 0) {
    return prisma.patient.update({ where: { id }, data: { isActive: false } });
  }
  await prisma.patient.delete({ where: { id } });
  return { message: "Paciente eliminado correctamente" };
};

export const listDoctors = async (query: DoctorsQuery) => {
  const { page, limit, search, active } = query;
  const { skip, take } = getPagination(page, limit);
  const where = {
    ...(active ? { isActive: active === "true" } : {}),
    ...personSearch(search),
  };

  const [items, total] = await prisma.$transaction([
    prisma.doctor.findMany({
      where,
      skip,
      take,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: { _count: { select: { prescriptions: true } } },
    }),
    prisma.doctor.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const getDoctor = async (id: string) => {
  const item = await prisma.doctor.findUnique({
    where: { id },
    include: { _count: { select: { prescriptions: true } } },
  });
  if (!item) throw new ApiError(404, "Médico no encontrado");
  return item;
};

export const createDoctor = (input: DoctorCreate) =>
  prisma.doctor.create({ data: input });

export const updateDoctor = async (id: string, input: DoctorUpdate) => {
  await getDoctor(id);
  return prisma.doctor.update({ where: { id }, data: input });
};

export const deleteDoctor = async (id: string) => {
  const doctor = await getDoctor(id);
  if (doctor._count.prescriptions > 0) {
    return prisma.doctor.update({ where: { id }, data: { isActive: false } });
  }
  await prisma.doctor.delete({ where: { id } });
  return { message: "Médico eliminado correctamente" };
};

const prescriptionInclude = {
  patient: true,
  doctor: true,
  items: {
    include: {
      product: {
        include: { category: true, laboratory: true },
      },
    },
  },
  dispensations: {
    include: {
      dispensedBy: {
        select: { id: true, firstName: true, lastName: true, username: true },
      },
      items: {
        include: { product: true, batch: true },
      },
    },
    orderBy: { dispensedAt: "desc" as const },
  },
} as const;

export const listPrescriptions = async (query: PrescriptionsQuery) => {
  const { page, limit, search, patientId, doctorId, status, prescriptionType } =
    query;
  const { skip, take } = getPagination(page, limit);

  const where = {
    ...(patientId ? { patientId } : {}),
    ...(doctorId ? { doctorId } : {}),
    ...(status ? { status } : {}),
    ...(prescriptionType ? { prescriptionType } : {}),
    ...(search
      ? {
          OR: [
            { folio: { contains: search, mode: "insensitive" as const } },
            { patient: { rut: { contains: search, mode: "insensitive" as const } } },
            { doctor: { rut: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.prescription.findMany({
      where,
      include: prescriptionInclude,
      skip,
      take,
      orderBy: { issueDate: "desc" },
    }),
    prisma.prescription.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const getPrescription = async (id: string) => {
  const item = await prisma.prescription.findUnique({
    where: { id },
    include: prescriptionInclude,
  });
  if (!item) throw new ApiError(404, "Receta no encontrada");
  return item;
};

export const createPrescription = async (input: PrescriptionCreate) => {
  const [patient, doctor] = await Promise.all([
    prisma.patient.findUnique({ where: { id: input.patientId } }),
    prisma.doctor.findUnique({ where: { id: input.doctorId } }),
  ]);

  if (!patient?.isActive) throw new ApiError(400, "Paciente inexistente o inactivo");
  if (!doctor?.isActive) throw new ApiError(400, "Médico inexistente o inactivo");

  if (input.expirationDate && input.expirationDate <= input.issueDate) {
    throw new ApiError(400, "La fecha de vencimiento debe ser posterior a la emisión");
  }

  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true },
  });

  if (products.length !== productIds.length) {
    throw new ApiError(400, "Uno o más productos no existen o están inactivos");
  }

  return prisma.prescription.create({
    data: {
      folio: input.folio,
      origin: input.origin,
      prescriptionType: input.prescriptionType,
      issueDate: input.issueDate,
      expirationDate: input.expirationDate ?? null,
      hasBalanceControl:
        input.hasBalanceControl || input.prescriptionType === "BALANCE_CONTROL",
      patientId: input.patientId,
      doctorId: input.doctorId,
      fileUrl: input.fileUrl ?? null,
      retainedFileUrl: input.retainedFileUrl ?? null,
      notes: input.notes ?? null,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          prescribedQuantity: item.prescribedQuantity,
          remainingQuantity: item.prescribedQuantity,
          dosage: item.dosage ?? null,
          frequency: item.frequency ?? null,
          duration: item.duration ?? null,
        })),
      },
    },
    include: prescriptionInclude,
  });
};

export const cancelPrescription = async (
  id: string,
  input: CancelPrescription,
) => {
  const prescription = await getPrescription(id);
  if (prescription.status === "DISPENSED") {
    throw new ApiError(409, "Una receta completamente dispensada no puede cancelarse");
  }

  return prisma.prescription.update({
    where: { id },
    data: {
      status: "CANCELLED",
      notes: prescription.notes
        ? `${prescription.notes}\nCANCELACIÓN: ${input.reason}`
        : `CANCELACIÓN: ${input.reason}`,
    },
  });
};

export const createDispensationFromSale = async (
  userId: string,
  input: DispensationFromSale,
) => {
  const prescription = await getPrescription(input.prescriptionId);
  const sale = await prisma.sale.findUnique({
    where: { id: input.saleId },
    include: {
      items: {
        include: {
          prescriptionItem: true,
          product: true,
          batchAllocations: { include: { batch: true } },
        },
      },
    },
  });

  if (!sale) throw new ApiError(404, "Venta no encontrada");
  if (sale.status !== "COMPLETED") {
    throw new ApiError(409, "La venta debe estar completada");
  }

  const existing = await prisma.dispensation.findFirst({
    where: { saleId: sale.id, prescriptionId: prescription.id, status: "COMPLETED" },
  });
  if (existing) throw new ApiError(409, "Esta venta ya tiene una dispensación registrada para la receta");

  const matching = sale.items.filter(
    (item) => item.prescriptionItem?.prescriptionId === prescription.id,
  );

  if (!matching.length) {
    throw new ApiError(400, "La venta no contiene productos asociados a esta receta");
  }

  return prisma.$transaction(async (tx) => {
    const dispensation = await tx.dispensation.create({
      data: {
        code: input.code,
        prescriptionId: prescription.id,
        dispensedById: userId,
        saleId: sale.id,
        notes: input.notes ?? null,
      },
    });

    for (const saleItem of matching) {
      for (const allocation of saleItem.batchAllocations) {
        await tx.dispensationItem.create({
          data: {
            dispensationId: dispensation.id,
            productId: saleItem.productId,
            batchId: allocation.batchId,
            quantity: allocation.quantity,
          },
        });

        if (saleItem.product.isControlled) {
          const existingRecord = await tx.controlledDrugRecord.findFirst({
            where: {
              saleId: sale.id,
              productId: saleItem.productId,
              batchId: allocation.batchId,
              movementType: "DISPENSATION",
            },
          });

          if (existingRecord) {
            await tx.controlledDrugRecord.update({
              where: { id: existingRecord.id },
              data: { dispensationId: dispensation.id },
            });
          } else {
            const stockAgg = await tx.inventoryStock.aggregate({
              where: { batchId: allocation.batchId },
              _sum: { quantity: true },
            });
            const balanceAfter = Number(stockAgg._sum.quantity ?? 0);
            const balanceBefore = balanceAfter + allocation.quantity;

            await tx.controlledDrugRecord.create({
              data: {
                recordNumber: `CTRL-${crypto.randomUUID()}`,
                movementType: "DISPENSATION",
                productId: saleItem.productId,
                batchId: allocation.batchId,
                prescriptionId: prescription.id,
                dispensationId: dispensation.id,
                saleId: sale.id,
                patientId: prescription.patientId,
                doctorId: prescription.doctorId,
                quantity: allocation.quantity,
                balanceBefore,
                balanceAfter,
                prescriptionFolio: prescription.folio,
                userId,
              },
            });
          }
        }
      }
    }

    if (
      prescription.prescriptionType === "RETAINED" ||
      prescription.prescriptionType === "CHECK"
    ) {
      await tx.prescription.update({
        where: { id: prescription.id },
        data: { retainedAt: new Date() },
      });
    }

    return tx.dispensation.findUnique({
      where: { id: dispensation.id },
      include: {
        prescription: { include: { patient: true, doctor: true } },
        dispensedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        items: { include: { product: true, batch: true } },
        controlledRecords: true,
      },
    });
  });
};

export const listControlledRecords = async (query: ControlledQuery) => {
  const { page, limit, search, productId, patientId, movementType, status } = query;
  const { skip, take } = getPagination(page, limit);

  const where = {
    ...(productId ? { productId } : {}),
    ...(patientId ? { patientId } : {}),
    ...(movementType ? { movementType } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { recordNumber: { contains: search, mode: "insensitive" as const } },
            { prescriptionFolio: { contains: search, mode: "insensitive" as const } },
            { ispReference: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.controlledDrugRecord.findMany({
      where,
      include: {
        product: true,
        batch: true,
        patient: true,
        doctor: true,
        prescription: true,
        user: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
      skip,
      take,
      orderBy: { occurredAt: "desc" },
    }),
    prisma.controlledDrugRecord.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
};

export const createManualControlledRecord = async (
  userId: string,
  input: ControlledManual,
) => {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new ApiError(404, "Producto no encontrado");
  if (!product.isControlled) {
    throw new ApiError(400, "El producto indicado no está marcado como controlado");
  }

  let computedBalanceBefore = input.balanceBefore ?? null;
  let computedBalanceAfter = input.balanceAfter ?? null;

  if (input.batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: input.batchId } });
    if (!batch || batch.productId !== product.id) {
      throw new ApiError(400, "El lote no corresponde al producto");
    }

    if (computedBalanceBefore === null || computedBalanceAfter === null) {
      const stockAgg = await prisma.inventoryStock.aggregate({
        where: { batchId: input.batchId },
        _sum: { quantity: true },
      });
      const currentBatchStock = Number(stockAgg._sum.quantity ?? 0);
      computedBalanceBefore = computedBalanceBefore ?? currentBatchStock;
      if (computedBalanceAfter === null) {
        const isIn =
          input.movementType === "PURCHASE_RECEIPT" ||
          input.movementType === "RETURN" ||
          input.movementType === "ADJUSTMENT_IN";
        computedBalanceAfter = isIn
          ? computedBalanceBefore + input.quantity
          : Math.max(0, computedBalanceBefore - input.quantity);
      }
    }
  }

  return prisma.controlledDrugRecord.create({
    data: {
      recordNumber: input.recordNumber || `CTRL-${crypto.randomUUID()}`,
      movementType: input.movementType,
      productId: input.productId,
      batchId: input.batchId ?? null,
      prescriptionId: input.prescriptionId ?? null,
      patientId: input.patientId ?? null,
      doctorId: input.doctorId ?? null,
      quantity: input.quantity,
      balanceBefore: computedBalanceBefore,
      balanceAfter: computedBalanceAfter,
      prescriptionFolio: input.prescriptionFolio ?? null,
      ispReference: input.ispReference ?? null,
      reason: input.reason ?? null,
      userId,
    },
  });
};
