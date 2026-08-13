import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined

  // Prisma's schema has `url = env("DATABASE_URL")` which Prisma validates
  // at client creation time, even when using a driver adapter.
  // If DATABASE_URL is not set, env() returns the string "undefined"
  // causing URL_INVALID errors. Provide a dummy placeholder so validation
  // passes — the adapter handles the real connection.
  if (!dbUrl) {
    process.env.DATABASE_URL = 'file:./dummy.db'
  }

  const realUrl = dbUrl || process.env.DATABASE_URL || ''

  const libsql = createClient({
    url: realUrl,
    authToken,
  })

  const adapter = new PrismaLibSQL(libsql as any)
  return new PrismaClient({ adapter: adapter as any, log: ['error'] })
}

function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Lazy proxy: defers PrismaClient creation until first actual DB operation.
// Prevents build-time connection attempts when DATABASE_URL is unavailable.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    // Prevents Promise resolution issues with Proxy objects
    if (prop === 'then') return undefined
    if (prop === 'toJSON') return undefined

    const instance = getDb()
    const value = Reflect.get(instance, prop, instance)

    // Bind methods to the real PrismaClient instance
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})
