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

  console.log("Creating new Prisma client instance");

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Ensure prisma is always initialized
const prisma = globalForPrisma.prisma || createPrismaClient();

// Only reuse prisma client in development
if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
