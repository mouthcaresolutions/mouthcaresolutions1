import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession, validateSession, destroySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { action, username, password, token } = await request.json();

    if (action === 'login') {
      const user = await db.adminUser.findUnique({ where: { username } });
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      if (!verifyPassword(password, user.passwordHash)) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      const sessionToken = await createSession(username);
      return NextResponse.json({
        success: true,
        token: sessionToken,
        user: { username: user.username, name: user.name, role: user.role },
      });
    }

    if (action === 'verify') {
      if (!token) return NextResponse.json({ valid: false }, { status: 401 });
      const u = await validateSession(token);
      if (!u) return NextResponse.json({ valid: false }, { status: 401 });
      const user = await db.adminUser.findUnique({ where: { username: u } });
      return NextResponse.json({ valid: true, user: { username: user?.username, name: user?.name, role: user?.role } });
    }

    if (action === 'logout') {
      if (token) await destroySession(token);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
