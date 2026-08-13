import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db';

// ==================== PASSWORD HASHING (bcryptjs) ====================

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// ==================== JWT TOKENS ====================

const JWT_SECRET = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET environment variable is required (min 32 chars). Set it in Vercel env vars.');
  }
  return secret;
};

function base64urlEncode(data: string): string {
  return Buffer.from(data).toString('base64url');
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8');
}

interface JWTPayload {
  username: string;
  role: string;
  name: string;
  exp: number;
  iat: number;
}

export function createJWT(user: { username: string; role: string; name: string }): string {
  const payload: JWTPayload = {
    username: user.username,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000),
  };

  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET())
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET())
      .update(`${header}.${body}`)
      .digest('base64url');

    // Constant-time comparison
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(body)) as JWTPayload;

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ==================== SESSION MANAGEMENT (in-memory, Vercel-compatible) ====================

// Sessions now store the JWT token for quick lookup + expiry
if (!globalThis._adminSessions) {
  globalThis._adminSessions = new Map<string, { username: string; role: string; name: string; expires: number }>();
}

export async function createSession(user: { username: string; role: string; name: string } | string): Promise<string> {
  // Support both direct user object and username string (for backward compat)
  const userData = typeof user === 'string'
    ? { username: user, role: 'admin', name: user }
    : user;

  const token = createJWT({ username: userData.username, role: userData.role, name: userData.name });

  (globalThis._adminSessions || (globalThis._adminSessions = new Map())).set(token, {
    username: userData.username,
    role: userData.role,
    name: userData.name,
    expires: Date.now() + 24 * 60 * 60 * 1000,
  });

  return token;
}

export async function validateSession(token: string): Promise<string | null> {
  // First check in-memory session map (fast path)
  const session = globalThis._adminSessions?.get(token);
  if (session && Date.now() <= session.expires) {
    return session.username;
  }

  // Fallback: verify JWT itself (works across serverless invocations)
  const payload = verifyJWT(token);
  if (payload) {
    // Re-populate session cache
    globalThis._adminSessions?.set(token, {
      username: payload.username,
      role: payload.role,
      name: payload.name,
      expires: payload.exp * 1000,
    });
    return payload.username;
  }

  // Clean up expired
  if (session) globalThis._adminSessions?.delete(token);
  return null;
}

// Get full session data (for role checks etc)
export function getSessionData(token: string): { username: string; role: string; name: string; expires: number } | null {
  // Try in-memory first
  const session = globalThis._adminSessions?.get(token);
  if (session && Date.now() <= session.expires) return session;

  // Fallback to JWT
  const payload = verifyJWT(token);
  if (payload) {
    const data = { username: payload.username, role: payload.role, name: payload.name, expires: payload.exp * 1000 };
    globalThis._adminSessions?.set(token, data);
    return data;
  }

  return null;
}

export async function destroySession(token: string): Promise<void> {
  globalThis._adminSessions?.delete(token);
}

declare global {
  var _adminSessions: Map<string, { username: string; role: string; name: string; expires: number }> | undefined;
}

// ==================== RATE LIMITING ====================

// In-memory rate limiter for login attempts
if (!globalThis._loginAttempts) {
  globalThis._loginAttempts = new Map<string, { count: number; firstAttempt: number; lockedUntil: number | null }>();
}

declare global {
  var _loginAttempts: Map<string, { count: number; firstAttempt: number; lockedUntil: number | null }> | undefined;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window

export function checkLoginRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const attempts = globalThis._loginAttempts?.get(identifier);
  if (!attempts) return { allowed: true };

  // Check if locked out
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
  return { allowed: false, retryAfter: Math.ceil((attempts.lockedUntil - Date.now()) / 1000) };
  }

  // Reset if lockout expired
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    globalThis._loginAttempts?.delete(identifier);
    return { allowed: true };
  }

  // Reset if window expired
  if (Date.now() - attempts.firstAttempt > ATTEMPT_WINDOW) {
    globalThis._loginAttempts?.delete(identifier);
    return { allowed: true };
  }

  return { allowed: attempts.count < MAX_LOGIN_ATTEMPTS };
}

export function recordFailedLogin(identifier: string): void {
  const attempts = globalThis._loginAttempts?.get(identifier) || { count: 0, firstAttempt: Date.now(), lockedUntil: null };
  attempts.count++;

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }

  globalThis._loginAttempts?.set(identifier, attempts);
}

export function recordSuccessfulLogin(identifier: string): void {
  globalThis._loginAttempts?.delete(identifier);
}

// ==================== ADMIN SEEDING ====================

export async function seedAdmin() {
  const count = await db.adminUser.count();
  if (count === 0) {
    // Only seed if ADMIN_PASSWORD env var is set (first-time setup)
    const initialPassword = process.env.ADMIN_PASSWORD;
    if (!initialPassword) {
      console.warn('WARNING: No ADMIN_PASSWORD env var set. Run: npx prisma db seed or set up admin via /rajeshark/setup');
      return;
    }
    await db.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: hashPassword(initialPassword),
        name: 'Admin',
        role: 'admin',
      },
    });
    console.log('Admin user seeded with password from ADMIN_PASSWORD env var');
  }

  // Seed auto-blogger config
  const configCount = await db.autoBloggerConfig.count();
  if (configCount === 0) {
    await db.autoBloggerConfig.create({
      data: {
        enabled: true,
        postsPerDay: 3,
        categories: 'General Dentistry,Cosmetic Dentistry,Oral Hygiene,Pediatric Dentistry,Implants & Prosthodontics,Orthodontics,Preventive Dental Care',
        status: 'idle',
      },
    });
    console.log('Auto-blogger config seeded');
  }
}
