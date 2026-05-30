import { PrismaPg } from "@prisma/adapter-pg";

type GeneratedPrismaClient = {
  // biome-ignore lint/suspicious/noExplicitAny: Preserve the generated Prisma client's flexible API when generated types are unavailable in CI.
  [key: string]: any;
};

const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new (options?: unknown) => GeneratedPrismaClient;
};

const globalForPrisma = globalThis as unknown as {
  prisma: GeneratedPrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
