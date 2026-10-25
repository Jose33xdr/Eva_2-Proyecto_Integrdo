import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function check() {
  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    laboratories: await prisma.laboratory.count(),
    products: await prisma.product.count(),
    doctors: await prisma.doctor.count(),
    patients: await prisma.patient.count(),
    prescriptions: await prisma.prescription.count(),
    agreements: await prisma.agreement.count(),
    cashRegisters: await prisma.cashRegister.count(),
    cashSessions: await prisma.cashSession.count(),
    suppliers: await prisma.supplier.count(),
    purchases: await prisma.purchaseOrder.count(),
    inventoryLocations: await prisma.inventoryLocation.count(),
  };
  console.log('DB Counts:', JSON.stringify(counts, null, 2));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
