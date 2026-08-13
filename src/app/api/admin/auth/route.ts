import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@libsql/client';
import { verifyPassword, hashPassword, createSession, validateSession, destroySession, checkLoginRateLimit, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth';
import { z } from 'zod';

// Direct libsql connection — bypasses Prisma env() bug
function getDb() {
  const url = process.env.DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('DATABASE_URL not set');
  return createClient({ url, authToken: token || undefined });
}

// Legacy SHA-256 verification (for migration from old hash format)
function verifyLegacySHA256(password: string, hash: string): boolean {
  try {
    const LEGACY_SALT = 'MCS@2024Secure';
    const salted = crypto.createHash('sha256').update(`${password}:${LEGACY_SALT}`).digest('hex');
    if (salted === hash) return true;
    const plain = crypto.createHash('sha256').update(password).digest('hex');
    if (plain === hash) return true;
    return false;
  } catch {
    return false;
  }
}

function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2');
}

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
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
      }
      const { username, password } = parsed.data;

      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const identifier = `${ip}:${username}`;
      const rateCheck = checkLoginRateLimit(identifier);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: `Too many failed attempts. Try again in ${rateCheck.retryAfter} seconds.` },
          { status: 429 },
        );
      }

      // Direct libsql query — bypasses Prisma entirely
      const db = getDb();
      const result = await db.execute({
        sql: 'SELECT id, username, "passwordHash", name, role FROM AdminUser WHERE username = ?',
        args: [username],
      });
      const user = result.rows[0];

      if (!user) {
        recordFailedLogin(identifier);
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      let passwordValid = false;
      if (isBcryptHash(user.passwordHash)) {
        passwordValid = verifyPassword(password, user.passwordHash);
      } else {
        passwordValid = verifyLegacySHA256(password, user.passwordHash);
        if (passwordValid) {
          console.log(`Migrating password hash for user '${username}' from SHA-256 to bcrypt`);
          const newHash = hashPassword(password);
          await db.execute({
            sql: 'UPDATE AdminUser SET "passwordHash" = ? WHERE username = ?',
            args: [newHash, username],
          });
        }
      }

      if (!passwordValid) {
        recordFailedLogin(identifier);
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      recordSuccessfulLogin(identifier);
      const sessionToken = await createSession(username);

      const response = NextResponse.json({
        success: true,
        token: sessionToken,
        user: { username: user.username, name: user.name, role: user.role },
      });

      response.cookies.set('admin_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    if (action === 'verify') {
      const parsed = verifySchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ valid: false }, { status: 401 });
      const u = await validateSession(parsed.data.token);
      if (!u) return NextResponse.json({ valid: false }, { status: 401 });
      // Use libsql directly for user lookup
      const db = getDb();
      const result = await db.execute({
        sql: 'SELECT username, name, role FROM AdminUser WHERE username = ?',
        args: [u],
      });
      const user = result.rows[0];
      return NextResponse.json({ valid: true, user: { username: user?.username, name: user?.name, role: user?.role } });
    }

    if (action === 'logout') {
      const parsed = logoutSchema.safeParse(body);
      if (parsed.success) await destroySession(parsed.data.token);
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Auth failed', detail: msg.substring(0, 200) }, { status: 500 });
  }
}
