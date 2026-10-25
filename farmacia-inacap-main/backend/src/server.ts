import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`API Farmacia ejecutándose en http://localhost:${env.PORT}`);
  console.log(`Health: http://localhost:${env.PORT}/api/health`);
});

const shutdown = async (signal: string) => {
  console.log(`\n${signal} recibido. Cerrando servidor...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("Conexión a PostgreSQL cerrada.");
      process.exit(0);
    } catch (error) {
      console.error("Error cerrando Prisma:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Cierre forzado por timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
