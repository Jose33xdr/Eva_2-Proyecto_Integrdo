import {
  Boxes,
  ClipboardList,
  FileChartColumn,
  FileText,
  Handshake,
  LayoutDashboard,
  Building2,
  PackageSearch,
  Pill,
  ReceiptText,
  Settings,
  ShoppingBag,
  Stethoscope,
  UserRoundCog,
  UsersRound,
  WalletCards,
} from "lucide-react";

export const navigation = [
  {
    label: "General",
    items: [
      {
        label: "Dashboard",
        to: "/",
        icon: LayoutDashboard,
        permission: "reports.read",
      },
    ],
  },
  {
    label: "Operación",
    items: [
      {
        label: "POS / Ventas",
        to: "/pos",
        icon: ShoppingBag,
        permission: "sales.create",
      },
      {
        label: "Caja",
        to: "/cash",
        icon: WalletCards,
        permission: "cash.read",
      },
      {
        label: "Ventas",
        to: "/sales",
        icon: ReceiptText,
        permission: "sales.read",
      },
      {
        label: "Inventario",
        to: "/inventory",
        icon: Boxes,
        permission: "inventory.read",
      },
      {
        label: "Compras",
        to: "/purchases",
        icon: ClipboardList,
        permission: "purchases.read",
      },
    ],
  },
  {
    label: "Farmacia",
    items: [
      {
        label: "Productos",
        to: "/products",
        icon: Pill,
        permission: "products.read",
      },
      {
        label: "Laboratorios",
        to: "/laboratories",
        icon: Building2,
        permission: "products.read",
      },
      {
        label: "Pacientes",
        to: "/patients",
        icon: UsersRound,
        permission: "patients.read",
      },
      {
        label: "Médicos",
        to: "/doctors",
        icon: Stethoscope,
        permission: "prescriptions.read",
      },
      {
        label: "Recetas",
        to: "/prescriptions",
        icon: FileText,
        permission: "prescriptions.read",
      },
      {
        label: "Controlados",
        to: "/controlled",
        icon: PackageSearch,
        permission: "controlled.read",
      },
      {
        label: "Convenios",
        to: "/agreements",
        icon: Handshake,
        permission: "agreements.read",
      },
    ],
  },
  {
    label: "Administración",
    items: [
      {
        label: "Usuarios",
        to: "/users",
        icon: UserRoundCog,
        permission: "users.read",
      },
      {
        label: "Reportes",
        to: "/reports",
        icon: FileChartColumn,
        permission: "reports.read",
      },
      {
        label: "Configuración",
        to: "/settings",
        icon: Settings,
        permission: "settings.manage",
      },
    ],
  },
] as const;
