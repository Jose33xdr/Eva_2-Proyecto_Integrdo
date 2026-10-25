-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('REFRESH', 'PASSWORD_RESET', 'EMAIL_VERIFICATION');

-- CreateEnum
CREATE TYPE "AgreementType" AS ENUM ('ISAPRE', 'INSURANCE', 'CENABAST', 'EMPLOYEE', 'INSTITUTIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FIXED_PRICE');

-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SaleCoverageStatus" AS ENUM ('PENDING', 'APPLIED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ControlledMovementType" AS ENUM ('PURCHASE_RECEIPT', 'DISPENSATION', 'RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DESTRUCTION');

-- CreateEnum
CREATE TYPE "ControlledRecordStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'EXPORT', 'PRINT', 'APPROVE', 'CANCEL', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'CONTROLLED_STOCK', 'PRESCRIPTION_EXPIRING', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'READ', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN     "retainedAt" TIMESTAMP(3),
ADD COLUMN     "retainedFileUrl" VARCHAR(500);

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "coverageAmount" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "security_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "TokenType" NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreements" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "type" "AgreementType" NOT NULL,
    "rut" VARCHAR(20),
    "description" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_plans" (
    "id" UUID NOT NULL,
    "agreementId" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agreement_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_benefits" (
    "id" UUID NOT NULL,
    "agreementPlanId" UUID NOT NULL,
    "productId" UUID,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(14,2) NOT NULL,
    "maximumDiscount" DECIMAL(14,2),
    "minimumQuantity" INTEGER DEFAULT 1,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agreement_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_coverages" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "agreementPlanId" UUID NOT NULL,
    "beneficiaryCode" VARCHAR(100),
    "policyNumber" VARCHAR(100),
    "status" "CoverageStatus" NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_coverages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_coverages" (
    "id" UUID NOT NULL,
    "saleId" UUID NOT NULL,
    "patientCoverageId" UUID NOT NULL,
    "status" "SaleCoverageStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAmount" DECIMAL(14,2),
    "approvedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "copayAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "authorizationCode" VARCHAR(150),
    "externalReference" VARCHAR(150),
    "responseMessage" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_coverages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controlled_drug_records" (
    "id" UUID NOT NULL,
    "recordNumber" VARCHAR(100) NOT NULL,
    "movementType" "ControlledMovementType" NOT NULL,
    "status" "ControlledRecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "productId" UUID NOT NULL,
    "batchId" UUID,
    "prescriptionId" UUID,
    "dispensationId" UUID,
    "saleId" UUID,
    "patientId" UUID,
    "doctorId" UUID,
    "quantity" INTEGER NOT NULL,
    "balanceBefore" INTEGER,
    "balanceAfter" INTEGER,
    "prescriptionFolio" VARCHAR(100),
    "ispReference" VARCHAR(150),
    "reason" TEXT,
    "userId" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "controlled_drug_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" "AuditAction" NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(100),
    "entityId" VARCHAR(100),
    "description" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "metadata" JSONB,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "type" "AlertType" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "title" VARCHAR(180) NOT NULL,
    "message" TEXT NOT NULL,
    "productId" UUID,
    "batchId" UUID,
    "createdById" UUID,
    "resolvedById" UUID,
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "value" TEXT NOT NULL,
    "description" VARCHAR(255),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "security_tokens_tokenHash_key" ON "security_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "security_tokens_userId_idx" ON "security_tokens"("userId");

-- CreateIndex
CREATE INDEX "security_tokens_type_idx" ON "security_tokens"("type");

-- CreateIndex
CREATE INDEX "security_tokens_expiresAt_idx" ON "security_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "agreements_code_key" ON "agreements"("code");

-- CreateIndex
CREATE INDEX "agreements_type_idx" ON "agreements"("type");

-- CreateIndex
CREATE INDEX "agreements_isActive_idx" ON "agreements"("isActive");

-- CreateIndex
CREATE INDEX "agreements_name_idx" ON "agreements"("name");

-- CreateIndex
CREATE INDEX "agreement_plans_agreementId_idx" ON "agreement_plans"("agreementId");

-- CreateIndex
CREATE INDEX "agreement_plans_isActive_idx" ON "agreement_plans"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_plans_agreementId_code_key" ON "agreement_plans"("agreementId", "code");

-- CreateIndex
CREATE INDEX "agreement_benefits_agreementPlanId_idx" ON "agreement_benefits"("agreementPlanId");

-- CreateIndex
CREATE INDEX "agreement_benefits_productId_idx" ON "agreement_benefits"("productId");

-- CreateIndex
CREATE INDEX "agreement_benefits_discountType_idx" ON "agreement_benefits"("discountType");

-- CreateIndex
CREATE INDEX "agreement_benefits_isActive_idx" ON "agreement_benefits"("isActive");

-- CreateIndex
CREATE INDEX "patient_coverages_patientId_idx" ON "patient_coverages"("patientId");

-- CreateIndex
CREATE INDEX "patient_coverages_agreementPlanId_idx" ON "patient_coverages"("agreementPlanId");

-- CreateIndex
CREATE INDEX "patient_coverages_status_idx" ON "patient_coverages"("status");

-- CreateIndex
CREATE INDEX "patient_coverages_isPrimary_idx" ON "patient_coverages"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "patient_coverages_patientId_agreementPlanId_beneficiaryCode_key" ON "patient_coverages"("patientId", "agreementPlanId", "beneficiaryCode");

-- CreateIndex
CREATE INDEX "sale_coverages_saleId_idx" ON "sale_coverages"("saleId");

-- CreateIndex
CREATE INDEX "sale_coverages_patientCoverageId_idx" ON "sale_coverages"("patientCoverageId");

-- CreateIndex
CREATE INDEX "sale_coverages_status_idx" ON "sale_coverages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "controlled_drug_records_recordNumber_key" ON "controlled_drug_records"("recordNumber");

-- CreateIndex
CREATE INDEX "controlled_drug_records_productId_idx" ON "controlled_drug_records"("productId");

-- CreateIndex
CREATE INDEX "controlled_drug_records_batchId_idx" ON "controlled_drug_records"("batchId");

-- CreateIndex
CREATE INDEX "controlled_drug_records_prescriptionId_idx" ON "controlled_drug_records"("prescriptionId");

-- CreateIndex
CREATE INDEX "controlled_drug_records_dispensationId_idx" ON "controlled_drug_records"("dispensationId");

-- CreateIndex
CREATE INDEX "controlled_drug_records_saleId_idx" ON "controlled_drug_records"("saleId");

-- CreateIndex
CREATE INDEX "controlled_drug_records_patientId_idx" ON "controlled_drug_records"("patientId");

-- CreateIndex
CREATE INDEX "controlled_drug_records_doctorId_idx" ON "controlled_drug_records"("doctorId");

-- CreateIndex
CREATE INDEX "controlled_drug_records_userId_idx" ON "controlled_drug_records"("userId");

-- CreateIndex
CREATE INDEX "controlled_drug_records_movementType_idx" ON "controlled_drug_records"("movementType");

-- CreateIndex
CREATE INDEX "controlled_drug_records_occurredAt_idx" ON "controlled_drug_records"("occurredAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_productId_idx" ON "alerts"("productId");

-- CreateIndex
CREATE INDEX "alerts_batchId_idx" ON "alerts"("batchId");

-- CreateIndex
CREATE INDEX "alerts_dueAt_idx" ON "alerts"("dueAt");

-- CreateIndex
CREATE INDEX "alerts_createdAt_idx" ON "alerts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "security_tokens" ADD CONSTRAINT "security_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_plans" ADD CONSTRAINT "agreement_plans_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_benefits" ADD CONSTRAINT "agreement_benefits_agreementPlanId_fkey" FOREIGN KEY ("agreementPlanId") REFERENCES "agreement_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_benefits" ADD CONSTRAINT "agreement_benefits_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_coverages" ADD CONSTRAINT "patient_coverages_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_coverages" ADD CONSTRAINT "patient_coverages_agreementPlanId_fkey" FOREIGN KEY ("agreementPlanId") REFERENCES "agreement_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_coverages" ADD CONSTRAINT "sale_coverages_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_coverages" ADD CONSTRAINT "sale_coverages_patientCoverageId_fkey" FOREIGN KEY ("patientCoverageId") REFERENCES "patient_coverages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_drug_records" ADD CONSTRAINT "controlled_drug_records_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_drug_records" ADD CONSTRAINT "controlled_drug_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_drug_records" ADD CONSTRAINT "controlled_drug_records_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_drug_records" ADD CONSTRAINT "controlled_drug_records_dispensationId_fkey" FOREIGN KEY ("dispensationId") REFERENCES "dispensations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_drug_records" ADD CONSTRAINT "controlled_drug_records_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_drug_records" ADD CONSTRAINT "controlled_drug_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_drug_records" ADD CONSTRAINT "controlled_drug_records_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controlled_drug_records" ADD CONSTRAINT "controlled_drug_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
