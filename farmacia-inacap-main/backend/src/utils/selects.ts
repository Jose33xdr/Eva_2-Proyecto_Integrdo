export const safeUserSelect = {
  id: true,
  rut: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  username: true,
  status: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  lastLoginAt: true,
  roleId: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
    },
  },
} as const;
