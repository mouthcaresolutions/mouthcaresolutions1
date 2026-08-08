import crypto from 'crypto';
import { db } from './db';

const SALT = 'MCS@2024Secure';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`${password}:${SALT}`).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function createSession(username: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  // Store token in memory - for production use a proper session store
  if (!globalThis._adminSessions) {
    globalThis._adminSessions = new Map<string, { username: string; expires: number }>();
  }
  globalThis._adminSessions.set(token, {
    username,
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  return token;
}

export async function validateSession(token: string): Promise<string | null> {
  if (!globalThis._adminSessions) return null;
  const session = globalThis._adminSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expires) {
    globalThis._adminSessions.delete(token);
    return null;
  }
  return session.username;
}

export async function destroySession(token: string): Promise<void> {
  if (!globalThis._adminSessions) return;
  globalThis._adminSessions.delete(token);
}

declare global {
  var _adminSessions: Map<string, { username: string; expires: number }> | undefined;
}

export async function seedAdmin() {
  const count = await db.adminUser.count();
  if (count === 0) {
    await db.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        name: 'Admin',
        role: 'admin',
      },
    });
    console.log('Admin user seeded: admin / admin123');
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
