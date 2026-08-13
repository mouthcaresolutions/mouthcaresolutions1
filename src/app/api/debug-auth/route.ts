import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  const results: Record<string, string> = {};

  // Check env vars
  results.DATABASE_URL = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET';
  results.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ? 'SET (len=' + process.env.TURSO_AUTH_TOKEN.length + ')' : 'NOT SET';
  results.JWT_SECRET = process.env.JWT_SECRET ? 'SET (len=' + process.env.JWT_SECRET.length + ')' : 'NOT SET';

  // Try DB connection
  try {
    const url = process.env.DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('DATABASE_URL not set');
    const db = createClient({ url, authToken: token || undefined });
    const res = await db.execute('SELECT 1 as ok');
    results.dbConnection = 'OK - ' + JSON.stringify(res.rows);

    // Check AdminUser table
    try {
      const users = await db.execute('SELECT id, username, role, length("passwordHash") as hashLen FROM AdminUser');
      results.adminUsers = JSON.stringify(users.rows);
    } catch (e: any) {
      results.adminUsersError = e.message;
    }
  } catch (e: any) {
    results.dbError = e.message;
  }

  return NextResponse.json(results);
}