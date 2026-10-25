-- CreateEnum
CREATE TYPE "PrescriptionOrigin" AS ENUM ('PHYSICAL', 'DIGITAL');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'PARTIALLY_DISPENSED', 'DISPENSED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DispensationStatus" AS ENUM ('COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "rut" VARCHAR(20) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "birthDate" TIMESTAMP(3),
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "address" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" UUID NOT NULL,
    "rut" VARCHAR(20) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "specialty" VARCHAR(150),
    "registration" VARCHAR(100),
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL,
    "folio" VARCHAR(100) NOT NULL,
    "origin" "PrescriptionOrigin" NOT NULL,
    "prescriptionType" "PrescriptionType" NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "hasBalanceControl" BOOLEAN NOT NULL DEFAULT false,
    "patientId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "fileUrl" VARCHAR(500),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" UUID NOT NULL,
    "prescriptionId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "prescribedQuantity" INTEGER NOT NULL,
    "dispensedQuantity" INTEGER NOT NULL DEFAULT 0,
    "remainingQuantity" INTEGER NOT NULL,
    "dosage" VARCHAR(255),
    "frequency" VARCHAR(150),
    "duration" VARCHAR(150),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "prescriptionId" UUID NOT NULL,
    "dispensedById" UUID NOT NULL,
    "status" "DispensationStatus" NOT NULL DEFAULT 'COMPLETED',
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispensations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensation_items" (
    "id" UUID NOT NULL,
    "dispensationId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispensation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_rut_key" ON "patients"("rut");

-- CreateIndex
CREATE INDEX "patients_lastName_firstName_idx" ON "patients"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "patients_isActive_idx" ON "patients"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_rut_key" ON "doctors"("rut");

-- CreateIndex
CREATE INDEX "doctors_lastName_firstName_idx" ON "doctors"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "doctors_isActive_idx" ON "doctors"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_folio_key" ON "prescriptions"("folio");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_idx" ON "prescriptions"("patientId");

-- CreateIndex
CREATE INDEX "prescriptions_doctorId_idx" ON "prescriptions"("doctorId");

-- CreateIndex
CREATE INDEX "prescriptions_status_idx" ON "prescriptions"("status");

-- CreateIndex
CREATE INDEX "prescriptions_prescriptionType_idx" ON "prescriptions"("prescriptionType");

-- CreateIndex
CREATE INDEX "prescriptions_issueDate_idx" ON "prescriptions"("issueDate");

-- CreateIndex
CREATE INDEX "prescriptions_expirationDate_idx" ON "prescriptions"("expirationDate");

-- CreateIndex
CREATE INDEX "prescription_items_prescriptionId_idx" ON "prescription_items"("prescriptionId");

-- CreateIndex
CREATE INDEX "prescription_items_productId_idx" ON "prescription_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "prescription_items_prescriptionId_productId_key" ON "prescription_items"("prescriptionId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "dispensations_code_key" ON "dispensations"("code");

-- CreateIndex
CREATE INDEX "dispensations_prescriptionId_idx" ON "dispensations"("prescriptionId");

-- CreateIndex
CREATE INDEX "dispensations_dispensedById_idx" ON "dispensations"("dispensedById");

-- CreateIndex
CREATE INDEX "dispensations_dispensedAt_idx" ON "dispensations"("dispensedAt");

-- CreateIndex
CREATE INDEX "dispensations_status_idx" ON "dispensations"("status");

-- CreateIndex
CREATE INDEX "dispensation_items_dispensationId_idx" ON "dispensation_items"("dispensationId");

-- CreateIndex
CREATE INDEX "dispensation_items_productId_idx" ON "dispensation_items"("productId");

-- CreateIndex
CREATE INDEX "dispensation_items_batchId_idx" ON "dispensation_items"("batchId");

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_dispensedById_fkey" FOREIGN KEY ("dispensedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensation_items" ADD CONSTRAINT "dispensation_items_dispensationId_fkey" FOREIGN KEY ("dispensationId") REFERENCES "dispensations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensation_items" ADD CONSTRAINT "dispensation_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispensation_items" ADD CONSTRAINT "dispensation_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
