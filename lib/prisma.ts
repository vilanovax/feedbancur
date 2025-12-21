import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Handle Prisma Client initialization errors
if (typeof window === "undefined") {
  prisma.$connect().catch((error) => {
    console.error("❌ Failed to connect to database:", error);
    if (error.message.includes("Can't reach database server")) {
      console.error("💡 Make sure DATABASE_URL is set correctly in environment variables");
    }
  });
}

