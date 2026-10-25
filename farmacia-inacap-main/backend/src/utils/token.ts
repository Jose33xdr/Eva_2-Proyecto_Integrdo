import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import type { JwtUserPayload } from "../types/auth.js";

export const signAccessToken = (payload: JwtUserPayload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtUserPayload;
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString("base64url");
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const getRefreshExpiration = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_DAYS);
  return expiresAt;
};
