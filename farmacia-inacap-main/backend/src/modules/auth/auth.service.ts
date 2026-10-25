import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { verifyPassword } from "../../utils/password.js";
import {
  generateRefreshToken,
  getRefreshExpiration,
  hashToken,
  signAccessToken,
} from "../../utils/token.js";
import type { JwtUserPayload } from "../../types/auth.js";
import type { LoginInput } from "./auth.schemas.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const getUserForAuth = async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
    include: {
      role: {
        include: {
          permissions: {
            where: {
              permission: {
                isActive: true,
              },
            },
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });
};

const buildAuthPayload = (user: Awaited<ReturnType<typeof getUserForAuth>>) => {
  if (!user) {
    throw new ApiError(401, "Credenciales inválidas");
  }

  const permissions = user.role.permissions
    .filter((item) => item.permission.isActive)
    .map((item) => item.permission.code);

  const payload: JwtUserPayload = {
    sub: user.id,
    username: user.username,
    role: user.role.code,
    permissions,
  };

  return payload;
};

export const login = async (input: LoginInput) => {
  const user = await getUserForAuth(input.username);

  if (!user) {
    throw new ApiError(401, "Credenciales inválidas");
  }

  if (user.status !== "ACTIVE" || !user.role.isActive) {
    throw new ApiError(403, "Usuario o rol inactivo o bloqueado");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(423, "Usuario bloqueado temporalmente");
  }

  const validPassword = await verifyPassword(input.password, user.passwordHash);

  if (!validPassword) {
    const nextAttempts = user.failedLoginAttempts + 1;
    const shouldLock = nextAttempts >= MAX_FAILED_ATTEMPTS;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : nextAttempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
          : null,
      },
    });

    throw new ApiError(401, "Credenciales inválidas");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  const payload = buildAuthPayload(user);
  const accessToken = signAccessToken(payload);

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  await prisma.securityToken.create({
    data: {
      userId: user.id,
      type: "REFRESH",
      tokenHash: refreshTokenHash,
      expiresAt: getRefreshExpiration(),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      rut: user.rut,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role.code,
      permissions: payload.permissions,
    },
  };
};

export const refresh = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.securityToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          role: {
            include: {
              permissions: {
                where: {
                  permission: {
                    isActive: true,
                  },
                },
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (
    !storedToken ||
    storedToken.type !== "REFRESH" ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    throw new ApiError(401, "Refresh token inválido o expirado");
  }

  if (storedToken.user.status !== "ACTIVE" || !storedToken.user.role.isActive) {
    throw new ApiError(403, "Usuario o rol inactivo o bloqueado");
  }

  const payload = {
    sub: storedToken.user.id,
    username: storedToken.user.username,
    role: storedToken.user.role.code,
    permissions: storedToken.user.role.permissions
      .filter((item) => item.permission.isActive)
      .map((item) => item.permission.code),
  };

  const nextRefreshToken = generateRefreshToken();

  await prisma.$transaction([
    prisma.securityToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    }),
    prisma.securityToken.create({
      data: {
        userId: storedToken.user.id,
        type: "REFRESH",
        tokenHash: hashToken(nextRefreshToken),
        expiresAt: getRefreshExpiration(),
      },
    }),
  ]);

  return {
    accessToken: signAccessToken(payload),
    refreshToken: nextRefreshToken,
  };
};

export const logout = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);

  const token = await prisma.securityToken.findUnique({
    where: { tokenHash },
  });

  if (token && !token.revokedAt) {
    await prisma.securityToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });
  }
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      rut: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      username: true,
      status: true,
      lastLoginAt: true,
      role: {
        select: {
          code: true,
          name: true,
          isActive: true,
          permissions: {
            where: {
              permission: {
                isActive: true,
              },
            },
            select: {
              permission: {
                select: {
                  code: true,
                  name: true,
                  module: true,
                  action: true,
                  isActive: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "Usuario no encontrado");
  }

  if (user.status !== "ACTIVE" || !user.role.isActive) {
    throw new ApiError(403, "Usuario o rol inactivo o bloqueado");
  }

  const permissions = user.role.permissions
    .filter((item) => item.permission.isActive)
    .map((item) => item.permission.code);

  return {
    id: user.id,
    rut: user.rut,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    username: user.username,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    role: user.role.code,
    permissions,
  };
};
