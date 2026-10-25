import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://farmacia_user:farmacia_password@localhost:5433/farmacia_db";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Creando 1 registro para cada vista...");

  // 1. Obtener usuario administrador existente
  const adminUser = await prisma.user.findFirst({
    where: { status: "ACTIVE" },
  });
  if (!adminUser) {
    throw new Error("No se encontró usuario administrador en la base de datos.");
  }

  // 2. Obtener Categoría y Laboratorio base
  const category = await prisma.category.findFirst({
    where: { code: "MEDICAMENTOS" },
  });
  if (!category) {
    throw new Error("No se encontró la categoría MEDICAMENTOS.");
  }

  const laboratory = await prisma.laboratory.findFirst({
    where: { code: "CHILE_TEVAPHARM" },
  });
  if (!laboratory) {
    throw new Error("No se encontró el laboratorio CHILE_TEVAPHARM.");
  }

  // 3. Crear 1 Producto
  const product = await prisma.product.upsert({
    where: { sku: "PARA-500-16" },
    update: {},
    create: {
      sku: "PARA-500-16",
      barcode: "7800000000018",
      name: "Paracetamol 500 mg",
      description: "Comprimidos para alivio de dolor leve a moderado y fiebre.",
      productType: "MEDICINE",
      prescriptionType: "NONE",
      controlledDrugType: "NONE",
      requiresPrescription: false,
      isControlled: false,
      isCenabast: false,
      concentration: "500 mg",
      pharmaceuticalForm: "Comprimidos",
      presentation: "Caja con 16 comprimidos",
      purchasePrice: 850,
      salePrice: 1990,
      minimumStock: 10,
      categoryId: category.id,
      laboratoryId: laboratory.id,
      isActive: true,
    },
  });
  console.log(`[OK] Producto creado: ${product.name} (SKU: ${product.sku})`);

  // 4. Crear 1 Proveedor
  const supplier = await prisma.supplier.upsert({
    where: { rut: "76123456-7" },
    update: {},
    create: {
      rut: "76123456-7",
      businessName: "Droguería e Insumos Farmacéuticos SpA",
      tradeName: "Droguería Central",
      contactName: "Carlos Mendoza (Ejecutivo de ventas)",
      email: "ventas@drogueriacentral.cl",
      phone: "+56 9 1234 5678",
      address: "Av. Providencia 1234, Bodega 3",
      commune: "Providencia",
      region: "Región Metropolitana",
      isActive: true,
    },
  });
  console.log(`[OK] Proveedor creado: ${supplier.businessName}`);

  // 5. Crear 1 Médico / Doctor
  const doctor = await prisma.doctor.upsert({
    where: { rut: "14234567-8" },
    update: {},
    create: {
      rut: "14234567-8",
      firstName: "Alejandro",
      lastName: "Silva Morales",
      specialty: "Medicina General",
      registration: "SIS-84521",
      phone: "+56 9 8765 4321",
      email: "dr.silva@clinicacentral.cl",
      isActive: true,
    },
  });
  console.log(`[OK] Médico creado: Dr. ${doctor.firstName} ${doctor.lastName}`);

  // 6. Crear 1 Paciente
  const patient = await prisma.patient.upsert({
    where: { rut: "18345678-9" },
    update: {},
    create: {
      rut: "18345678-9",
      firstName: "María",
      lastName: "González Rojas",
      birthDate: new Date("1992-05-14"),
      phone: "+56 9 9876 5432",
      email: "maria.gonzalez@correo.cl",
      address: "Los Alerces 456, Depto 302, Santiago",
      isActive: true,
    },
  });
  console.log(`[OK] Paciente creada: ${patient.firstName} ${patient.lastName}`);

  // 7. Crear 1 Receta Médica
  const prescription = await prisma.prescription.upsert({
    where: { folio: "RX-2026-0001" },
    update: {},
    create: {
      folio: "RX-2026-0001",
      origin: "PHYSICAL",
      prescriptionType: "SIMPLE",
      status: "ACTIVE",
      issueDate: new Date("2026-10-20"),
      expirationDate: new Date("2026-11-20"),
      hasBalanceControl: false,
      patientId: patient.id,
      doctorId: doctor.id,
      notes: "Tomar 1 comprimido cada 8 horas por 5 días en caso de fiebre o dolor.",
      items: {
        create: {
          productId: product.id,
          prescribedQuantity: 2,
          dispensedQuantity: 0,
          remainingQuantity: 2,
          dosage: "500 mg",
          frequency: "Cada 8 horas",
          duration: "5 días",
        },
      },
    },
  });
  console.log(`[OK] Receta médica creada: Folio ${prescription.folio}`);

  // 8. Crear 1 Convenio de salud con Plan y Beneficio
  let agreement = await prisma.agreement.findUnique({
    where: { code: "FONASA-B" },
  });
  if (!agreement) {
    agreement = await prisma.agreement.create({
      data: {
        code: "FONASA-B",
        name: "Convenio FONASA Tramo B",
        type: "INSTITUTIONAL",
        rut: "61601000-K",
        description: "Convenio institucional con Fonasa para descuentos en medicamentos ambulatorios.",
        isActive: true,
        plans: {
          create: {
            code: "PLAN-FONASA-B",
            name: "Plan Ambulatorio Fonasa B",
            description: "20% de descuento en medicamentos genéricos y bioequivalentes.",
            isActive: true,
            benefits: {
              create: {
                productId: product.id,
                discountType: "PERCENTAGE",
                discountValue: 20,
                isActive: true,
              },
            },
          },
        },
      },
    });
  }
  console.log(`[OK] Convenio creado: ${agreement.name}`);

  // 9. Crear 1 Caja
  const cashRegister = await prisma.cashRegister.upsert({
    where: { code: "CJ01" },
    update: {},
    create: {
      code: "CJ01",
      name: "Caja Principal",
      description: "Caja ubicada en el mesón de atención principal para cobros en efectivo y tarjetas.",
      isActive: true,
    },
  });
  console.log(`[OK] Caja creada: ${cashRegister.name} (${cashRegister.code})`);

  // 10. Abrir 1 Sesión de caja activa con monto inicial
  const existingSession = await prisma.cashSession.findFirst({
    where: { cashRegisterId: cashRegister.id, status: "OPEN" },
  });
  if (!existingSession) {
    const session = await prisma.cashSession.create({
      data: {
        cashRegisterId: cashRegister.id,
        openedById: adminUser.id,
        status: "OPEN",
        openingAmount: 50000,
        expectedAmount: 50000,
        notes: "Turno mañana - Apertura con sencillo para vuelto.",
      },
    });
    console.log(`[OK] Sesión de caja abierta: ID ${session.id} (Monto inicial: $50.000)`);
  } else {
    console.log(`[OK] Sesión de caja ya estaba abierta.`);
  }

  // 11. Crear 1 Orden de compra
  const existingOrder = await prisma.purchaseOrder.findUnique({
    where: { code: "OC-001" },
  });
  if (!existingOrder) {
    const order = await prisma.purchaseOrder.create({
      data: {
        code: "OC-001",
        supplierId: supplier.id,
        createdById: adminUser.id,
        status: "SENT",
        orderDate: new Date("2026-10-22"),
        expectedDate: new Date("2026-10-25"),
        subtotal: 42500,
        taxAmount: 8075,
        totalAmount: 50575,
        notes: "Despacho en horario de mañana en bodega.",
        details: {
          create: {
            productId: product.id,
            quantityOrdered: 50,
            quantityReceived: 0,
            unitCost: 850,
            subtotal: 42500,
          },
        },
      },
    });
    console.log(`[OK] Orden de compra creada: ${order.code} (Total: $50.575)`);
  } else {
    console.log(`[OK] Orden de compra OC-001 ya existía.`);
  }

  // 12. Crear 1 Lote y Stock en bodega (para vista de Inventario y POS)
  const warehouse = await prisma.inventoryLocation.findFirst({
    where: { code: "BOD-PRINCIPAL" },
  });
  if (warehouse) {
    let batch = await prisma.batch.findFirst({
      where: { productId: product.id, batchNumber: "LOT-2026-A01" },
    });
    if (!batch) {
      batch = await prisma.batch.create({
        data: {
          batchNumber: "LOT-2026-A01",
          productId: product.id,
          supplierId: supplier.id,
          expirationDate: new Date("2028-12-31"),
          initialQuantity: 100,
          purchasePrice: 850,
        },
      });

      await prisma.inventoryStock.upsert({
        where: {
          batchId_locationId: {
            batchId: batch.id,
            locationId: warehouse.id,
          },
        },
        update: { quantity: 100 },
        create: {
          batchId: batch.id,
          locationId: warehouse.id,
          quantity: 100,
        },
      });
      console.log(`[OK] Lote y stock creado en Bodega Principal: 100 unidades (Lote: LOT-2026-A01)`);
    } else {
      console.log(`[OK] Lote LOT-2026-A01 ya existía.`);
    }
  }

  console.log("\n Todos los registros de ejemplo fueron agregados exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error al poblar datos:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
