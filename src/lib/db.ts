import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_DATABASE_URL || dbUrl

  // For Turso: use the direct URL for writes
  const libsql = createClient({
    url: directUrl || dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  })

  // PrismaLibSQL adapter - type cast needed for newer prisma version compatibility
  const adapter = new PrismaLibSQL(libsql as any)
  return new PrismaClient({
    adapter: adapter as any,
    log: ['error'],
    // Explicitly override the datasource URL from schema's env() to prevent
    // Prisma from reading a stale/undefined value when using an adapter
    datasources: { db: { url: directUrl || dbUrl } },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
