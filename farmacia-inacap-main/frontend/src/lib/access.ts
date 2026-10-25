import type { AuthUser } from "../types/auth";

export const getRoleCode = (user: AuthUser | null): string | null => {
  if (!user) {
    return null;
  }

  if (typeof user.role === "string") {
    return user.role;
  }

  return user.role?.code ?? null;
};

export const getUserPermissions = (user: AuthUser | null): string[] => {
  if (!user || !Array.isArray(user.permissions)) {
    return [];
  }

  return user.permissions.map((permission) =>
    typeof permission === "string" ? permission : permission.code,
  );
};

export const hasUserPermission = (
  user: AuthUser | null,
  permission: string,
): boolean => {
  if (getRoleCode(user) === "ADMIN") {
    return true;
  }

  return getUserPermissions(user).includes(permission);
};

export const getDefaultAuthenticatedPath = (user: AuthUser | null): string => {
  if (!user) {
    return "/login";
  }

  if (hasUserPermission(user, "reports.read")) {
    return "/";
  }

  const destinations = [
    { permission: "sales.create", path: "/pos" },
    { permission: "sales.read", path: "/sales" },
    { permission: "cash.read", path: "/cash" },
    { permission: "inventory.read", path: "/inventory" },
    { permission: "products.read", path: "/products" },
    { permission: "purchases.read", path: "/purchases" },
    { permission: "patients.read", path: "/patients" },
    { permission: "prescriptions.read", path: "/prescriptions" },
    { permission: "controlled.read", path: "/controlled" },
    { permission: "agreements.read", path: "/agreements" },
    { permission: "reports.read", path: "/reports" },
    { permission: "users.read", path: "/users" },
    { permission: "settings.manage", path: "/settings" },
  ];

  return (
    destinations.find((destination) =>
      hasUserPermission(user, destination.permission),
    )?.path ?? "/403"
  );
};
