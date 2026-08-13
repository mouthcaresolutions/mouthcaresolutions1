import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'NOT SET',
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET (hidden)' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.length} chars)` : 'NOT SET',
      ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'unknown',
    };
    const count = await db.adminUser.count();
    const users = await db.adminUser.findMany({ select: { username: true, role: true, createdAt: true } });
    return NextResponse.json({
      status: 'ok',
      env: envCheck,
      userCount: count,
      users: users.map(u => ({ username: u.username, role: u.role, hashPrefix: 'ok' })),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error?.message || 'unknown',
      name: error?.constructor?.name || 'unknown',
      stack: error?.stack?.substring(0, 500) || 'no stack',
    }, { status: 500 });
  }
}
