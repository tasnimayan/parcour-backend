import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }
  prisma = global.__prisma;
}

export default prisma;
