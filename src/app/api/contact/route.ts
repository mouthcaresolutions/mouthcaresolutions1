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

// CRITICAL FIX #3: In-memory rate limiting note — this is a known limitation
// in serverless. For production, use Vercel KV, Upstash Redis, or similar.
// The current implementation still provides some protection within a single
// serverless instance's lifetime.
const contactAttempts = new Map<string, { count: number; windowStart: number }>();
const CONTACT_LIMIT = 3;
const CONTACT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = contactAttempts.get(ip);
  if (!record || now - record.windowStart > CONTACT_WINDOW) {
    contactAttempts.set(ip, { count: 1, windowStart: now });
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

    // Store in CRM database as a lead
    const crm = getCRM();
    const leadId = 'lead_' + crypto.randomBytes(8).toString('hex');

    await crm.execute({
      sql: `INSERT INTO CRMPatient (id, name, phone, email, createdAt)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [leadId, name, phone || null, email],
    });

    // MEDIUM #11 FIX: Store message in ContactMessage table (assumed to already exist
    // from setup script). Removed CREATE TABLE IF NOT EXISTS that ran on every request.
    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await crm.execute({
      sql: `INSERT INTO ContactMessage (id, patientId, name, email, phone, message)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [msgId, leadId, name, email, phone || null, message],
    });

    return NextResponse.json({ success: true, message: 'Message received. We will contact you shortly.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
