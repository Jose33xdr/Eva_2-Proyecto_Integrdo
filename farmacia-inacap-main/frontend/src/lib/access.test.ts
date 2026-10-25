import { describe, expect, it } from "vitest";
import type { AuthUser } from "../types/auth";
import {
  getDefaultAuthenticatedPath,
  getRoleCode,
  getUserPermissions,
  hasUserPermission,
} from "./access";

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: "user-1",
  rut: "11.111.111-1",
  firstName: "Ana",
  lastName: "Silva",
  email: "ana@farmacia.local",
  username: "asilva",
  role: { code: "CASHIER", name: "Cajero" },
  permissions: ["sales.create", { code: "cash.read", name: "Ver Caja" }],
  ...overrides,
});

describe("Access & RBAC Matrix (src/lib/access.ts)", () => {
  it("obtiene correctamente el código de rol tanto en formato string como objeto", () => {
    expect(getRoleCode(null)).toBeNull();
    expect(getRoleCode(makeUser({ role: "PHARMACIST" }))).toBe("PHARMACIST");
    expect(
      getRoleCode(makeUser({ role: { code: "ADMIN", name: "Administrador" } })),
    ).toBe("ADMIN");
  });

  it("normaliza la lista de permisos del usuario a un arreglo de códigos string", () => {
    expect(getUserPermissions(null)).toEqual([]);
    expect(getUserPermissions(makeUser({ permissions: undefined }))).toEqual([]);
    expect(getUserPermissions(makeUser())).toEqual(["sales.create", "cash.read"]);
  });

  it("concede todos los permisos automáticamente al rol ADMIN y valida permisos específicos para otros roles", () => {
    const admin = makeUser({
      role: { code: "ADMIN", name: "Admin" },
      permissions: [],
    });
    const cashier = makeUser();

    expect(hasUserPermission(admin, "settings.manage")).toBe(true);
    expect(hasUserPermission(admin, "controlled.read")).toBe(true);

    expect(hasUserPermission(cashier, "sales.create")).toBe(true);
    expect(hasUserPermission(cashier, "cash.read")).toBe(true);
    expect(hasUserPermission(cashier, "settings.manage")).toBe(false);
    expect(hasUserPermission(null, "sales.create")).toBe(false);
  });

  it("resuelve la ruta autenticada por defecto según la jerarquía de permisos del rol", () => {
    expect(getDefaultAuthenticatedPath(null)).toBe("/login");

    const admin = makeUser({ role: "ADMIN", permissions: [] });
    expect(getDefaultAuthenticatedPath(admin)).toBe("/");

    const cashier = makeUser({
      role: "CASHIER",
      permissions: ["sales.create", "cash.read"],
    });
    expect(getDefaultAuthenticatedPath(cashier)).toBe("/pos");

    const warehouse = makeUser({
      role: "WAREHOUSE",
      permissions: ["inventory.read", "purchases.read"],
    });
    expect(getDefaultAuthenticatedPath(warehouse)).toBe("/inventory");

    const restricted = makeUser({
      role: "GUEST",
      permissions: [],
    });
    expect(getDefaultAuthenticatedPath(restricted)).toBe("/403");
  });
});
