import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined

  if (!dbUrl || dbUrl === 'undefined') {
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
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    if (prop === 'then') return undefined
    if (prop === 'toJSON') return undefined
    const instance = getDb()
    const value = Reflect.get(instance, prop, instance)
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})
