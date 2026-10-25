import type { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
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

type AgreementsQuery = z.infer<typeof agreementsQuerySchema>;
type AgreementCreate = z.infer<typeof agreementCreateSchema>;
type AgreementUpdate = z.infer<typeof agreementUpdateSchema>;
type PlanCreate = z.infer<typeof planCreateSchema>;
type PlanUpdate = z.infer<typeof planUpdateSchema>;
type BenefitCreate = z.infer<typeof benefitCreateSchema>;
type BenefitUpdate = z.infer<typeof benefitUpdateSchema>;
type PatientCoverageCreate = z.infer<typeof patientCoverageCreateSchema>;
type PreviewCoverage = z.infer<typeof previewCoverageSchema>;
type ApplyCoverage = z.infer<typeof applyCoverageSchema>;

const agreementInclude = {
  plans: {
    include: {
      benefits: { include: { product: true } },
      _count: { select: { coverages: true } },
    },
  },
} as const;

export const listAgreements = (query: AgreementsQuery) =>
  prisma.agreement.findMany({
    where: {
      ...(query.type ? { type: query.type } : {}),
      ...(query.active ? { isActive: query.active === "true" } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: "insensitive" as const } },
              { name: { contains: query.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: agreementInclude,
    orderBy: { name: "asc" },
  });

export const getAgreement = async (id: string) => {
  const item = await prisma.agreement.findUnique({
    where: { id },
    include: agreementInclude,
  });
  if (!item) throw new ApiError(404, "Convenio no encontrado");
  return item;
};

export const createAgreement = (input: AgreementCreate) =>
  prisma.agreement.create({ data: input, include: agreementInclude });

export const updateAgreement = async (id: string, input: AgreementUpdate) => {
  await getAgreement(id);
  return prisma.agreement.update({
    where: { id },
    data: input,
    include: agreementInclude,
  });
};

export const createPlan = async (agreementId: string, input: PlanCreate) => {
  const agreement = await getAgreement(agreementId);
  if (!agreement.isActive) throw new ApiError(409, "El convenio está inactivo");
  return prisma.agreementPlan.create({
    data: { agreementId, ...input },
    include: { agreement: true, benefits: true },
  });
};

export const updatePlan = async (id: string, input: PlanUpdate) => {
  const plan = await prisma.agreementPlan.findUnique({ where: { id } });
  if (!plan) throw new ApiError(404, "Plan no encontrado");
  return prisma.agreementPlan.update({ where: { id }, data: input });
};

export const createBenefit = async (planId: string, input: BenefitCreate) => {
  const plan = await prisma.agreementPlan.findUnique({
    where: { id: planId },
    include: { agreement: true },
  });
  if (!plan || !plan.isActive || !plan.agreement.isActive) {
    throw new ApiError(409, "El plan o convenio está inactivo");
  }

  if (input.productId) {
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product?.isActive) throw new ApiError(400, "Producto inexistente o inactivo");
  }

  return prisma.agreementBenefit.create({
    data: { agreementPlanId: planId, ...input },
    include: { product: true, agreementPlan: { include: { agreement: true } } },
  });
};

export const updateBenefit = async (id: string, input: BenefitUpdate) => {
  const benefit = await prisma.agreementBenefit.findUnique({ where: { id } });
  if (!benefit) throw new ApiError(404, "Beneficio no encontrado");
  return prisma.agreementBenefit.update({ where: { id }, data: input });
};

export const createPatientCoverage = async (input: PatientCoverageCreate) => {
  const [patient, plan] = await Promise.all([
    prisma.patient.findUnique({ where: { id: input.patientId } }),
    prisma.agreementPlan.findUnique({
      where: { id: input.agreementPlanId },
      include: { agreement: true },
    }),
  ]);

  if (!patient?.isActive) throw new ApiError(400, "Paciente inexistente o inactivo");
  if (!plan?.isActive || !plan.agreement.isActive) {
    throw new ApiError(400, "Plan o convenio inexistente/inactivo");
  }

  if (input.isPrimary) {
    await prisma.patientCoverage.updateMany({
      where: { patientId: input.patientId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.patientCoverage.create({
    data: input,
    include: { agreementPlan: { include: { agreement: true } }, patient: true },
  });
};

const isDateValid = (from: Date | null, until: Date | null, now: Date) =>
  (!from || from <= now) && (!until || until >= now);

const benefitDiscount = (
  discountType: string,
  discountValue: number,
  maximumDiscount: number | null,
  unitPrice: number,
  quantity: number,
) => {
  const gross = unitPrice * quantity;
  let discount = 0;

  if (discountType === "PERCENTAGE") {
    discount = gross * (discountValue / 100);
  } else if (discountType === "FIXED_AMOUNT") {
    discount = discountValue * quantity;
  } else if (discountType === "FIXED_PRICE") {
    discount = Math.max(0, gross - discountValue * quantity);
  }

  if (maximumDiscount !== null) {
    discount = Math.min(discount, maximumDiscount);
  }

  return Math.max(0, Math.min(gross, Math.round(discount)));
};

export const previewCoverage = async (input: PreviewCoverage) => {
  const coverage = await prisma.patientCoverage.findUnique({
    where: { id: input.patientCoverageId },
    include: {
      patient: true,
      agreementPlan: {
        include: {
          agreement: true,
          benefits: true,
        },
      },
    },
  });

  if (
    !coverage ||
    coverage.status !== "ACTIVE" ||
    !coverage.patient.isActive ||
    !coverage.agreementPlan.isActive ||
    !coverage.agreementPlan.agreement.isActive
  ) {
    throw new ApiError(400, "Cobertura, plan o convenio inexistente o inactivo");
  }

  const now = new Date();
  if (
    !isDateValid(coverage.validFrom, coverage.validUntil, now) ||
    !isDateValid(
      coverage.agreementPlan.validFrom,
      coverage.agreementPlan.validUntil,
      now,
    ) ||
    !isDateValid(
      coverage.agreementPlan.agreement.validFrom,
      coverage.agreementPlan.agreement.validUntil,
      now,
    )
  ) {
    throw new ApiError(409, "La cobertura, plan o convenio está fuera de vigencia");
  }

  const ids = [...new Set(input.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
  });
  if (products.length !== ids.length) {
    throw new ApiError(400, "Uno o más productos no existen o están inactivos");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  let totalDiscount = 0;
  const lines = [];

  for (const item of input.items) {
    const product = productMap.get(item.productId)!;
    const unitPrice = item.unitPrice ?? Number(product.salePrice);
    const gross = Math.round(unitPrice * item.quantity);

    const benefit = coverage.agreementPlan.benefits.find(
      (candidate) =>
        candidate.isActive &&
        (!candidate.productId || candidate.productId === product.id) &&
        (candidate.minimumQuantity ?? 1) <= item.quantity &&
        isDateValid(candidate.validFrom, candidate.validUntil, now),
    );

    let discount = 0;
    let source = "NONE";

    if (coverage.agreementPlan.agreement.type === "CENABAST" && product.isCenabast) {
      const capValid =
        product.cenabastMaxPrice !== null &&
        (!product.cenabastValidFrom || product.cenabastValidFrom <= now) &&
        (!product.cenabastValidUntil || product.cenabastValidUntil >= now);

      if (capValid) {
        const cappedPrice = Number(product.cenabastMaxPrice);
        discount = Math.max(0, Math.round((unitPrice - cappedPrice) * item.quantity));
        source = "CENABAST_MAX_PRICE";
      }
    }

    if (benefit && discount === 0) {
      discount = benefitDiscount(
        benefit.discountType,
        Number(benefit.discountValue),
        benefit.maximumDiscount === null ? null : Number(benefit.maximumDiscount),
        unitPrice,
        item.quantity,
      );
      source = `BENEFIT:${benefit.id}`;
    }

    totalDiscount += discount;
    lines.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      gross,
      discount,
      finalAmount: gross - discount,
      source,
    });
  }

  return {
    patientCoverageId: coverage.id,
    patient: coverage.patient,
    agreement: coverage.agreementPlan.agreement,
    plan: {
      id: coverage.agreementPlan.id,
      code: coverage.agreementPlan.code,
      name: coverage.agreementPlan.name,
    },
    totalDiscount: Math.round(totalDiscount),
    lines,
  };
};

export const applyCoverageToSale = async (
  saleId: string,
  input: ApplyCoverage,
) => {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { coverages: true },
  });
  if (!sale) throw new ApiError(404, "Venta no encontrada");
  if (sale.status !== "COMPLETED") {
    throw new ApiError(409, "La venta debe estar completada");
  }

  const coverage = await prisma.patientCoverage.findUnique({
    where: { id: input.patientCoverageId },
    include: {
      patient: true,
      agreementPlan: {
        include: {
          agreement: true,
        },
      },
    },
  });
  if (
    !coverage ||
    coverage.status !== "ACTIVE" ||
    !coverage.patient.isActive ||
    !coverage.agreementPlan.isActive ||
    !coverage.agreementPlan.agreement.isActive
  ) {
    throw new ApiError(400, "Cobertura, plan o convenio inexistente o inactivo");
  }

  const now = new Date();
  if (
    !isDateValid(coverage.validFrom, coverage.validUntil, now) ||
    !isDateValid(
      coverage.agreementPlan.validFrom,
      coverage.agreementPlan.validUntil,
      now,
    ) ||
    !isDateValid(
      coverage.agreementPlan.agreement.validFrom,
      coverage.agreementPlan.agreement.validUntil,
      now,
    )
  ) {
    throw new ApiError(409, "La cobertura, plan o convenio está fuera de vigencia");
  }

  if (!sale.patientId || sale.patientId !== coverage.patientId) {
    throw new ApiError(400, "La cobertura no corresponde al paciente de la venta");
  }

  const alreadyApplied = sale.coverages.reduce(
    (sum, item) => sum + Number(item.approvedAmount),
    0,
  );
  const availableDiscount = Math.max(
    0,
    Number(sale.discountAmount) - alreadyApplied,
  );

  if (input.approvedAmount > availableDiscount) {
    throw new ApiError(
      400,
      "El monto aprobado supera el descuento disponible de la venta. En POS, aplica el descuento de convenio antes del checkout.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const record = await tx.saleCoverage.create({
      data: {
        saleId,
        patientCoverageId: coverage.id,
        status: "APPLIED",
        requestedAmount: input.approvedAmount,
        approvedAmount: input.approvedAmount,
        copayAmount: Number(sale.totalAmount),
        authorizationCode: input.authorizationCode ?? null,
        externalReference: input.externalReference ?? null,
        responseMessage: input.responseMessage ?? "Cobertura aplicada",
        appliedAt: new Date(),
      },
      include: {
        patientCoverage: {
          include: { agreementPlan: { include: { agreement: true } } },
        },
      },
    });

    await tx.sale.update({
      where: { id: saleId },
      data: {
        coverageAmount: { increment: input.approvedAmount },
        discountAmount: { decrement: input.approvedAmount },
      },
    });

    return record;
  });
};
