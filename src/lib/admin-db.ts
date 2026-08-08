import { PrismaClient } from '@prisma/client'

let _db: PrismaClient | null = null;

export function getAdminDb() {
  if (!_db) {
    _db = new PrismaClient({ log: ['error'] });
  }
  return _db;
}

export const adminDb = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getAdminDb() as any)[prop];
  },
});
