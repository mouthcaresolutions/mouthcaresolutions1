import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCRM } from '@/lib/crm-db';
import crypto from 'crypto';

const contactSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(200),
  phone: z.string().max(20).optional().default(''),
  message: z.string().min(10).max(2000).trim(),
});

// SEC-L02 FIX: Attach rate limiter to globalThis for serverless persistence
const CONTACT_LIMIT = 3;
const CONTACT_WINDOW = 60 * 60 * 1000; // 1 hour

function getContactRateLimiter() {
  if (!globalThis._contactRateLimiter) {
    globalThis._contactRateLimiter = new Map<string, { count: number; windowStart: number }>();
  }
  return globalThis._contactRateLimiter as Map<string, { count: number; windowStart: number }>;
}

function checkContactRateLimit(ip: string): boolean {
  const limiter = getContactRateLimiter();
  const now = Date.now();
  const record = limiter.get(ip);
  if (!record || now - record.windowStart > CONTACT_WINDOW) {
    limiter.set(ip, { count: 1, windowStart: now });
    return true;
  }
  return record.count < CONTACT_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (!checkContactRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fill all required fields correctly.' },
        { status: 400 },
      );
    }

    const { name, email, phone, message } = parsed.data;

    // SEC-H08 FIX: Only store in ContactMessage table, NOT in CRMPatient.
    // Previous code inserted into CRMPatient, allowing spam bots to pollute CRM with fake patient records.
    const crm = getCRM();
    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await crm.execute({
      sql: `INSERT INTO ContactMessage (id, name, email, phone, message)
            VALUES (?, ?, ?, ?, ?)`,
      args: [msgId, name, email, phone || null, message],
    });

    return NextResponse.json({ success: true, message: 'Message received. We will contact you shortly.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
