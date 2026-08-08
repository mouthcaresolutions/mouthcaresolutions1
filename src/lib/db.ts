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

  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({
    adapter,
    log: ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
