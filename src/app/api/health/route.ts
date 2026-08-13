import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Temporary diagnostic endpoint — remove after fixing env vars
export async function GET() {
  const checks: Record<string, string> = {};

  checks.DATABASE_URL = process.env.DATABASE_URL
    ? `SET (${process.env.DATABASE_URL.length} chars, starts: ${process.env.DATABASE_URL.substring(0, 12)}...)`
    : 'NOT SET';
  checks.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN
    ? `SET (${process.env.TURSO_AUTH_TOKEN.length} chars)`
    : 'NOT SET';
  checks.JWT_SECRET = process.env.JWT_SECRET
    ? `SET (${process.env.JWT_SECRET.length} chars)`
    : 'NOT SET';
  checks.ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'NOT SET';
  checks.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET';
  checks.NODE_ENV = process.env.NODE_ENV || 'NOT SET';
  checks.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET';

  return NextResponse.json({ env: checks, timestamp: new Date().toISOString() });
}
