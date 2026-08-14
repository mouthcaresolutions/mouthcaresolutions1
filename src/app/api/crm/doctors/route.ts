import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { validateSession } from '@/lib/auth';
import * as blogDb from '@/lib/blog-db';
import { getCRM } from '@/lib/crm-db';
import { createDoctorSchema, updateDoctorSchema, validateBody } from '@/lib/validation';

// Helper: check if user is admin
async function isAdmin(token: string): Promise<boolean> {
  const username = await validateSession(token);
  if (!username) return false;
  const user = await blogDb.getAdminUser(username);
  return user?.role === 'admin';
}

// GET: List CRM doctors
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const crm = getCRM();

    const sql = activeOnly
      ? 'SELECT * FROM CRMDoctor WHERE active = 1 ORDER BY name'
      : 'SELECT * FROM CRMDoctor ORDER BY name';

    const result = await crm.execute({ sql, args: [] });

    const doctors = result.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      specialization: row.specialization as string | null,
      phone: row.phone as string | null,
      email: row.email as string | null,
      availableDays: row.availableDays as string | null,
      startTime: row.startTime as string | null,
      endTime: row.endTime as string | null,
      slotDuration: row.slotDuration as number,
      active: row.active as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('List doctors error:', error);
    return NextResponse.json({ error: 'Failed to list doctors' }, { status: 500 });
  }
}

// POST: Add doctor (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(createDoctorSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const v = parsed.data;
    const crm = getCRM();

    const id = 'doc_' + crypto.randomBytes(12).toString('hex');

    await crm.execute({
      sql: `INSERT INTO CRMDoctor (
        id, name, specialization, phone, email, availableDays,
        startTime, endTime, slotDuration, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        v.name,
        v.specialization ?? null,
        v.phone ?? null,
        v.email ?? null,
        v.availableDays ?? 'Mon,Tue,Wed,Thu,Fri,Sat',
        v.startTime ?? '10:00',
        v.endTime ?? '20:00',
        v.slotDuration ?? 30,
        v.active !== undefined ? (v.active ? 1 : 0) : 1,
      ],
    });

    return NextResponse.json(
      { success: true, id, name: v.name, message: 'Doctor added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add doctor error:', error);
    return NextResponse.json({ error: 'Failed to add doctor' }, { status: 500 });
  }
}

// PUT: Update doctor (admin only)
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await isAdmin(token))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(updateDoctorSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const v = parsed.data;
    const crm = getCRM();

    const existing = await crm.execute({
      sql: 'SELECT id FROM CRMDoctor WHERE id = ?',
      args: [v.id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const updatableFields = [
      'name', 'specialization', 'phone', 'email', 'availableDays',
      'startTime', 'endTime', 'slotDuration', 'active',
    ];

    const setClauses: string[] = ['updatedAt = CURRENT_TIMESTAMP'];
    const args: (string | number | null)[] = [];

    for (const field of updatableFields) {
      const val = (v as Record<string, unknown>)[field] as string | number | null | undefined;
      if (val !== undefined) {
        setClauses.push(`${field} = ?`);
        if (field === 'active') {
          args.push(val ? 1 : 0);
        } else {
          args.push(val === '' ? null : val);
        }
      }
    }

    if (setClauses.length <= 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    args.push(v.id);
    await crm.execute({
      sql: `UPDATE CRMDoctor SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ success: true, message: 'Doctor updated successfully' });
  } catch (error) {
    console.error('Update doctor error:', error);
    return NextResponse.json({ error: 'Failed to update doctor' }, { status: 500 });
  }
}
