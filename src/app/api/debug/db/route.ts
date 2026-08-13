import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  const env = {
    DATABASE_URL: process.env.DATABASE_URL || 'NOT SET',
    DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL || 'NOT SET',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? `SET (${process.env.TURSO_AUTH_TOKEN.length}c)` : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.length}c)` : 'NOT SET',
  };

  // Test 1: Direct libsql connection
  try {
    const libsql = createClient({
      url: process.env.DATABASE_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
    const result = await libsql.execute('SELECT 1 as ok');
    env['libsql_test'] = 'OK: ' + JSON.stringify(result.rows[0]);
  } catch (e: any) {
    env['libsql_test'] = 'FAIL: ' + (e.message || e);
  }

  // Test 2: Prisma via db module
  try {
    const { db } = await import('@/lib/db');
    const count = await db.adminUser.count();
    env['prisma_test'] = 'OK: ' + count + ' users';
  } catch (e: any) {
    env['prisma_test'] = 'FAIL: ' + (e.message || e).substring(0, 200);
  }

  return NextResponse.json({ env });
}