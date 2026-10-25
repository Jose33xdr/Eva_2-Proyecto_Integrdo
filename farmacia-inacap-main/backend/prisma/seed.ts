import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../generated/prisma/client.js";
import { normalizeRut } from "../src/utils/rut.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const roles = [
  {
    code: "ADMIN",
    name: "Administrador",
    description: "Acceso total al sistema",
    isSystem: true,
  },
  {
    code: "VENDEDOR",
    name: "Vendedor",
    description: "Ventas, clientes y consulta de catálogo",
    isSystem: true,
  },
  {
    code: "BODEGUERO",
    name: "Bodeguero",
    description: "Recepción, lotes, vencimientos y stock",
    isSystem: true,
  },
  {
    code: "TECNICO_FARMACIA",
    name: "Técnico en Farmacia",
    description: "Dispensación, inventario y recetas",
    isSystem: true,
  },
  {
    code: "QUIMICO_FARMACEUTICO",
    name: "Químico Farmacéutico",
    description: "Supervisión técnica, controlados y recetas",
    isSystem: true,
  },
];

const permissions = [
  ["users.read", "Ver usuarios", "users", "read"],
  ["users.create", "Crear usuarios", "users", "create"],
  ["users.update", "Editar usuarios", "users", "update"],
  ["users.delete", "Eliminar usuarios", "users", "delete"],

  ["products.read", "Ver productos", "products", "read"],
  ["products.create", "Crear productos", "products", "create"],
  ["products.update", "Editar productos", "products", "update"],
  ["products.delete", "Eliminar productos", "products", "delete"],

  ["inventory.read", "Ver inventario", "inventory", "read"],
  ["inventory.create", "Registrar inventario", "inventory", "create"],
  ["inventory.update", "Modificar inventario", "inventory", "update"],
  ["inventory.adjust", "Ajustar inventario", "inventory", "adjust"],

  ["purchases.read", "Ver compras", "purchases", "read"],
  ["purchases.create", "Crear compras", "purchases", "create"],
  ["purchases.receive", "Recepcionar compras", "purchases", "receive"],

  ["sales.read", "Ver ventas", "sales", "read"],
  ["sales.create", "Crear ventas", "sales", "create"],
  ["sales.cancel", "Anular ventas", "sales", "cancel"],

  ["cash.read", "Ver caja", "cash", "read"],
  ["cash.open", "Abrir caja", "cash", "open"],
  ["cash.close", "Cerrar caja", "cash", "close"],
  ["cash.adjust", "Ajustar caja", "cash", "adjust"],

  ["patients.read", "Ver pacientes", "patients", "read"],
  ["patients.create", "Crear pacientes", "patients", "create"],
  ["patients.update", "Editar pacientes", "patients", "update"],
  ["patients.delete", "Eliminar pacientes", "patients", "delete"],

  ["doctors.read", "Ver médicos", "doctors", "read"],
  ["doctors.create", "Crear médicos", "doctors", "create"],
  ["doctors.update", "Editar médicos", "doctors", "update"],
  ["doctors.delete", "Eliminar médicos", "doctors", "delete"],

  ["prescriptions.read", "Ver recetas", "prescriptions", "read"],
  ["prescriptions.create", "Registrar recetas", "prescriptions", "create"],
  ["prescriptions.dispense", "Dispensar recetas", "prescriptions", "dispense"],
  ["prescriptions.cancel", "Cancelar recetas", "prescriptions", "cancel"],

  ["controlled.read", "Ver controlados", "controlled", "read"],
  ["controlled.manage", "Gestionar controlados", "controlled", "manage"],

  ["agreements.read", "Ver convenios", "agreements", "read"],
  ["agreements.manage", "Gestionar convenios", "agreements", "manage"],

  ["reports.read", "Ver reportes", "reports", "read"],
  ["reports.export", "Exportar reportes", "reports", "export"],

  ["audit.read", "Ver auditoría", "audit", "read"],
  ["settings.manage", "Gestionar configuración", "settings", "manage"],
] as const;

const rolePermissionMap: Record<string, string[]> = {
  ADMIN: permissions.map(([code]) => code),

  VENDEDOR: [
    "products.read",
    "inventory.read",
    "sales.read",
    "sales.create",
    "cash.read",
    "cash.open",
    "cash.close",
    "patients.read",
    "patients.create",
    "patients.update",
    "doctors.read",
    "prescriptions.read",
  ],

  BODEGUERO: [
    "products.read",
    "inventory.read",
    "inventory.create",
    "inventory.update",
    "purchases.read",
    "purchases.receive",
    "reports.read",
  ],

  TECNICO_FARMACIA: [
    "products.read",
    "products.create",
    "inventory.read",
    "inventory.create",
    "inventory.update",
    "purchases.read",
    "patients.read",
    "patients.create",
    "patients.update",
    "doctors.read",
    "doctors.create",
    "prescriptions.read",
    "prescriptions.create",
    "prescriptions.dispense",
    "controlled.read",
  ],

  QUIMICO_FARMACEUTICO: [
    "products.read",
    "products.create",
    "products.update",
    "inventory.read",
    "inventory.create",
    "inventory.update",
    "inventory.adjust",
    "purchases.read",
    "purchases.create",
    "purchases.receive",
    "patients.read",
    "patients.create",
    "patients.update",
    "doctors.read",
    "doctors.create",
    "doctors.update",
    "doctors.delete",
    "prescriptions.read",
    "prescriptions.create",
    "prescriptions.dispense",
    "prescriptions.cancel",
    "controlled.read",
    "controlled.manage",
    "reports.read",
    "reports.export",
    "audit.read",
  ],
};

const inventoryLocations = [
  ["BOD-PRINCIPAL", "Bodega Principal", "WAREHOUSE"],
  ["VITRINA", "Vitrina", "DISPLAY"],
  ["REFRIGERADOS", "Refrigerados", "REFRIGERATED"],
  ["CONTROLADOS", "Medicamentos Controlados", "CONTROLLED"],
  ["CUARENTENA", "Cuarentena", "QUARANTINE"],
] as const;

const categories = [
  ["MEDICAMENTOS", "Medicamentos"],
  ["DISPOSITIVOS", "Dispositivos Médicos"],
  ["HIGIENE", "Higiene"],
  ["CUIDADO_PERSONAL", "Cuidado Personal"],
  ["SUPLEMENTOS", "Suplementos"],
  ["DERMOCOSMETICA", "Dermocosmética"],
  ["OTROS", "Otros"],
] as const;

const laboratories = [
  ["ABBOTT", "Abbott"],
  ["ANDROMACO", "Andrómaco"],
  ["ASTRAZENECA", "AstraZeneca"],
  ["BAGO", "Bagó"],
  ["BAYER", "Bayer"],
  ["BOEHRINGER_INGELHEIM", "Boehringer Ingelheim"],
  ["CHILE_TEVAPHARM", "Laboratorio Chile | Teva"],
  ["EUROFARMA", "Eurofarma"],
  ["GLAXOSMITHKLINE", "GlaxoSmithKline"],
  ["GRUNENTHAL", "Grünenthal"],
  ["ITF_LABOMED", "ITF Labomed"],
  ["JANSSEN", "Janssen"],
  ["KNOP", "Knop"],
  ["MAVER", "Maver"],
  ["MERCK", "Merck"],
  ["MINTLAB", "Mintlab"],
  ["MSD", "MSD"],
  ["NOVARTIS", "Novartis"],
  ["OPKO", "OPKO"],
  ["PASTEUR", "Pasteur"],
  ["PFIZER", "Pfizer"],
  ["PHARMA_INVESTI", "Pharma Investi"],
  ["PRATER", "Prater"],
  ["RECALCINE", "Recalcine"],
  ["ROCHE", "Roche"],
  ["SANDERSON", "Sanderson"],
  ["SANOFI", "Sanofi"],
  ["SAVAL", "Saval"],
  ["TECNOFARMA", "Tecnofarma"],
  ["TECNOQUIMICAS", "Tecnoquímicas"],
] as const;

async function main() {
  console.log("Iniciando seed...");

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: role,
    });
  }

  for (const [code, name, module, action] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {
        name,
        module,
        action,
        isActive: true,
      },
      create: {
        code,
        name,
        module,
        action,
        isActive: true,
      },
    });
  }

  const allRoles = await prisma.role.findMany();
  const allPermissions = await prisma.permission.findMany();

  const roleByCode = new Map(allRoles.map((role) => [role.code, role]));
  const permissionByCode = new Map(
    allPermissions.map((permission) => [permission.code, permission]),
  );

  for (const [roleCode, permissionCodes] of Object.entries(rolePermissionMap)) {
    const role = roleByCode.get(roleCode);
    if (!role) continue;

    for (const permissionCode of permissionCodes) {
      const permission = permissionByCode.get(permissionCode);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  for (const [code, name, type] of inventoryLocations) {
    await prisma.inventoryLocation.upsert({
      where: { code },
      update: {
        name,
        type,
        isActive: true,
      },
      create: {
        code,
        name,
        type,
        isActive: true,
      },
    });
  }

  for (const [code, name] of categories) {
    await prisma.category.upsert({
      where: { code },
      update: {
        name,
        isActive: true,
      },
      create: {
        code,
        name,
        isActive: true,
      },
    });
  }

  for (const [code, name] of laboratories) {
    await prisma.laboratory.upsert({
      where: { code },
      update: {
        name,
        isActive: true,
      },
      create: {
        code,
        name,
        isActive: true,
      },
    });
  }

  const adminRole = roleByCode.get("ADMIN");
  if (!adminRole) {
    throw new Error("No se pudo crear el rol ADMIN");
  }

  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "administrador";
  const adminRut = normalizeRut(process.env.ADMIN_RUT ?? "11.111.111-1");

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      rut: adminRut,
      firstName: process.env.ADMIN_FIRST_NAME ?? "Administrador",
      lastName: process.env.ADMIN_LAST_NAME ?? "Sistema",
      email: process.env.ADMIN_EMAIL ?? "admin@farmacia.local",
      passwordHash,
      status: "ACTIVE",
      roleId: adminRole.id,
    },
    create: {
      rut: adminRut,
      firstName: process.env.ADMIN_FIRST_NAME ?? "Administrador",
      lastName: process.env.ADMIN_LAST_NAME ?? "Sistema",
      email: process.env.ADMIN_EMAIL ?? "admin@farmacia.local",
      username: adminUsername,
      passwordHash,
      status: "ACTIVE",
      roleId: adminRole.id,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: "pharmacy.name" },
    update: {},
    create: {
      key: "pharmacy.name",
      value: "Farmacia Privada Comercial",
      description: "Nombre comercial del sistema",
      isPublic: true,
    },
  });

  console.log("Seed completado.");
  console.log(`Usuario administrador: ${adminUsername}`);
  console.log("La contraseña se toma desde ADMIN_PASSWORD en .env");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
