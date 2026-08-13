import { NextResponse } from 'next/server';

export async function GET() {
  // Check env vars FIRST (no DB needed)
  const envCheck = {
    DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 40)}...` : 'NOT SET',
    DATABASE_URL_raw: process.env.DATABASE_URL ?? 'undefined',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? `SET (${process.env.TURSO_AUTH_TOKEN.length} chars)` : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.length} chars)` : 'NOT SET',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'NOT SET',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'unknown',
  };

  // Now try DB
  try {
    const { db } = await import('@/lib/db');
    const count = await db.adminUser.count();
    const users = await db.adminUser.findMany({ select: { username: true, role: true } });
    return NextResponse.json({ status: 'ok', env: envCheck, userCount: count, users });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      env: envCheck,
      message: error?.message || 'unknown',
      name: error?.constructor?.name || 'unknown',
    }, { status: 500 });
  }
}
