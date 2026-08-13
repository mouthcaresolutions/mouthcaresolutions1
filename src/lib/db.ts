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
    console.warn('DATABASE_URL not set — database operations will fail')
  }

  const libsql = createClient({
    url: directUrl || dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  })

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

// Lazy Proxy — only creates the Prisma client on first property access.
// This prevents build-time failures when DATABASE_URL is not available.
// Key: use real PrismaClient as receiver (not the Proxy) so `this` is correct.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // Prevent thenable coercion — if something awaits `db`, don't treat it as a promise
    if (prop === 'then') return undefined
    const real = getDb()
    // Use real client as receiver so Prisma getters get correct `this`
    const val = Reflect.get(real, prop, real)
    // Bind methods to the real client so `this` is correct
    if (typeof val === 'function') return val.bind(real)
    return val
  },
})
