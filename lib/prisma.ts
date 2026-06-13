import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
    ssl: { rejectUnauthorized: false },
  })
}

function createClient(pool: Pool) {
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ??
  createClient(
    globalForPrisma.pool ?? (globalForPrisma.pool = createPool()),
  )

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { withRetry } from './db-retry'
export default prisma;
