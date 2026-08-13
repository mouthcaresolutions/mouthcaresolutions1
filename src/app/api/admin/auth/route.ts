import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession, validateSession, destroySession, checkLoginRateLimit, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  action: z.literal('login'),
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

const verifySchema = z.object({
  action: z.literal('verify'),
  token: z.string().min(1),
});

const logoutSchema = z.object({
  action: z.literal('logout'),
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'login') {
      // Validate input
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
      }
      const { username, password } = parsed.data;

      // Rate limiting by IP + username combo
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const identifier = `${ip}:${username}`;
      const rateCheck = checkLoginRateLimit(identifier);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: `Too many failed attempts. Try again in ${rateCheck.retryAfter} seconds.` },
          { status: 429 },
        );
      }

      const user = await db.adminUser.findUnique({ where: { username } });
      if (!user) {
        recordFailedLogin(identifier);
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      if (!verifyPassword(password, user.passwordHash)) {
        recordFailedLogin(identifier);
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      recordSuccessfulLogin(identifier);
      const sessionToken = await createSession(username);
      return NextResponse.json({
        success: true,
        token: sessionToken,
        user: { username: user.username, name: user.name, role: user.role },
      });
    }

    if (action === 'verify') {
      const parsed = verifySchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ valid: false }, { status: 401 });

      const u = await validateSession(parsed.data.token);
      if (!u) return NextResponse.json({ valid: false }, { status: 401 });
      const user = await db.adminUser.findUnique({ where: { username: u } });
      return NextResponse.json({ valid: true, user: { username: user?.username, name: user?.name, role: user?.role } });
    }

    if (action === 'logout') {
      const parsed = logoutSchema.safeParse(body);
      if (parsed.success) await destroySession(parsed.data.token);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
