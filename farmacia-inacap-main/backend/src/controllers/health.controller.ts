import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const healthCheck = async (_req: Request, res: Response) => {
  const databaseResult = await prisma.$queryRaw<
    Array<{
      database: string;
      user_name: string;
      server_time: Date;
    }>
  >`
    SELECT
      current_database() AS database,
      current_user AS user_name,
      NOW() AS server_time
  `;

  const database = databaseResult[0];

  return res.status(200).json({
    ok: true,
    service: "farmacia-inacap-api",
    environment: process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
    database: {
      connected: true,
      name: database?.database ?? null,
      user: database?.user_name ?? null,
      serverTime: database?.server_time ?? null,
    },
  });
};
