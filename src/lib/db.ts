import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment variables.");
  }
  
  // Set up pg connection pool
  const pool = new Pool({ 
    connectionString,
    // Add safety limits for local development hot-reloads
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Create Prisma Pg adapter instance
  const adapter = new PrismaPg(pool);
  
  // Initialize PrismaClient with WASM engine driver adapter
  prismaInstance = new PrismaClient({ adapter });
}

export const db = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
