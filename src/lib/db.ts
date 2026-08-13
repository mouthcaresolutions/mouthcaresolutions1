import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_DATABASE_URL || dbUrl

  if (!dbUrl) {
    // During build or when DATABASE_URL is not set, return a dummy client
    // that will fail on actual queries (caught by callers)
    console.warn('DATABASE_URL not set — database operations will fail')
  }

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
  })
}

function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Lazy accessor — only creates the Prisma client when actually used
// This prevents build-time failures when DATABASE_URL is not available
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})
