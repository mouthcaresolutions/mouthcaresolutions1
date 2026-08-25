import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { createClient } from '@libsql/client';

function getDb() {
  const url = process.env.DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('DATABASE_URL not set');
  return createClient({ url, authToken: token || undefined });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, newPassword } = body;

    // One-time reset code (remove this endpoint after use)
    if (secret !== 'mcs-reset-2024-temp') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const hash = hashPassword(newPassword);
    const db = getDb();
    await db.execute({
      sql: 'UPDATE AdminUser SET "passwordHash" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE username = ?',
      args: [hash, 'admin'],
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
