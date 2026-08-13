const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

function createPrismaClient() {
  // Use require() to defer module loading to runtime,
  // ensuring env vars are available when Prisma reads env('DATABASE_URL')
  const { PrismaClient } = require('@prisma/client')
  const { PrismaLibSQL } = require('@prisma/adapter-libsql')
  const { createClient } = require('@libsql/client')

  const dbUrl = process.env.DATABASE_URL || ''
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined

  const libsql = createClient({
    url: dbUrl || 'file:./dummy.db',
    authToken,
  })

  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter: adapter, log: ['error'] })
}

function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Lazy proxy: defers PrismaClient creation until first DB operation.
export const db = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === 'then') return undefined
    if (prop === 'toJSON') return undefined
    const instance = getDb()
    const value = instance[prop]
    if (typeof value === 'function') return value.bind(instance)
    return value
  },
})
