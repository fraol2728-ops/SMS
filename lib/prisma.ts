import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = (globalThis as any) as {
  prisma: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not defined. Please check your .env.local file."
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Ensure prisma is always initialized
const prisma = globalForPrisma.prisma || createPrismaClient();

// Only reuse prisma client in development
if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}

// Helper to run queries with retry on timeout
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isTimeout =
        error?.message?.includes("timed out") ||
        error?.message?.includes("Authentication timed out") ||
        error?.message?.includes("connection") ||
        error?.code === "P1001" ||
        error?.code === "P1002";

      if (isTimeout && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries reached");
}

export { prisma };
export default prisma;
