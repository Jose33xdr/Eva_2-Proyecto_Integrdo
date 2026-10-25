-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('MEDICINE', 'MEDICAL_DEVICE', 'HYGIENE', 'PERSONAL_CARE', 'SUPPLEMENT', 'DERMOCOSMETIC', 'OTHER');

-- CreateEnum
CREATE TYPE "PrescriptionType" AS ENUM ('NONE', 'SIMPLE', 'RETAINED', 'CHECK', 'BALANCE_CONTROL');

-- CreateEnum
CREATE TYPE "ControlledDrugType" AS ENUM ('NONE', 'PSYCHOTROPIC', 'NARCOTIC');

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laboratories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_ingredients" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "active_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(60) NOT NULL,
    "barcode" VARCHAR(50),
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "productType" "ProductType" NOT NULL,
    "prescriptionType" "PrescriptionType" NOT NULL DEFAULT 'NONE',
    "controlledDrugType" "ControlledDrugType" NOT NULL DEFAULT 'NONE',
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "isControlled" BOOLEAN NOT NULL DEFAULT false,
    "isCenabast" BOOLEAN NOT NULL DEFAULT false,
    "concentration" VARCHAR(100),
    "pharmaceuticalForm" VARCHAR(100),
    "presentation" VARCHAR(150),
    "purchasePrice" DECIMAL(12,2),
    "salePrice" DECIMAL(12,2) NOT NULL,
    "cenabastMaxPrice" DECIMAL(12,2),
    "cenabastValidFrom" TIMESTAMP(3),
    "cenabastValidUntil" TIMESTAMP(3),
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "categoryId" UUID NOT NULL,
    "laboratoryId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_active_ingredients" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "activeIngredientId" UUID NOT NULL,
    "quantity" DECIMAL(12,3),
    "unit" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_active_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "laboratories_code_key" ON "laboratories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "laboratories_name_key" ON "laboratories"("name");

-- CreateIndex
CREATE INDEX "laboratories_isActive_idx" ON "laboratories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "active_ingredients_code_key" ON "active_ingredients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "active_ingredients_name_key" ON "active_ingredients"("name");

-- CreateIndex
CREATE INDEX "active_ingredients_isActive_idx" ON "active_ingredients"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_laboratoryId_idx" ON "products"("laboratoryId");

-- CreateIndex
CREATE INDEX "products_productType_idx" ON "products"("productType");

-- CreateIndex
CREATE INDEX "products_prescriptionType_idx" ON "products"("prescriptionType");

-- CreateIndex
CREATE INDEX "products_controlledDrugType_idx" ON "products"("controlledDrugType");

-- CreateIndex
CREATE INDEX "products_isControlled_idx" ON "products"("isControlled");

-- CreateIndex
CREATE INDEX "products_isCenabast_idx" ON "products"("isCenabast");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "product_active_ingredients_productId_idx" ON "product_active_ingredients"("productId");

-- CreateIndex
CREATE INDEX "product_active_ingredients_activeIngredientId_idx" ON "product_active_ingredients"("activeIngredientId");

-- CreateIndex
CREATE UNIQUE INDEX "product_active_ingredients_productId_activeIngredientId_key" ON "product_active_ingredients"("productId", "activeIngredientId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "laboratories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_active_ingredients" ADD CONSTRAINT "product_active_ingredients_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_active_ingredients" ADD CONSTRAINT "product_active_ingredients_activeIngredientId_fkey" FOREIGN KEY ("activeIngredientId") REFERENCES "active_ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
