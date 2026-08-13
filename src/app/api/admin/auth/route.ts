import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword, createSession, validateSession, destroySession, checkLoginRateLimit, recordFailedLogin, recordSuccessfulLogin } from '@/lib/auth';
import { z } from 'zod';

// Legacy SHA-256 verification (for migration from old hash format)
function verifyLegacySHA256(password: string, hash: string): boolean {
  try {
    const computed = crypto.createHash('sha256').update(password).digest('hex');
    return computed === hash;
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

      let passwordValid = false;

      // Check if stored hash is bcrypt format
      if (isBcryptHash(user.passwordHash)) {
        passwordValid = verifyPassword(password, user.passwordHash);
      } else {
        // Legacy SHA-256 hash — verify and auto-migrate to bcrypt
        passwordValid = verifyLegacySHA256(password, user.passwordHash);
        if (passwordValid) {
          console.log(`Migrating password hash for user '${username}' from SHA-256 to bcrypt`);
          await db.adminUser.update({
            where: { username },
            data: { passwordHash: hashPassword(password) },
          });
        }
      }

      if (!passwordValid) {
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
