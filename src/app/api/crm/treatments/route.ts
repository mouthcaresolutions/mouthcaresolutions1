import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyJWT } from '@/lib/auth';
import * as blogDb from '@/lib/blog-db';
import { getCRM } from '@/lib/crm-db';
import { createTreatmentSchema, updateTreatmentSchema, validateBody } from '@/lib/validation';

// Helper: check if user is admin
function isAdmin(token: string): boolean {
  const payload = verifyJWT(token);
  if (!payload?.username) return false;
  // verifyJWT already validates the JWT signature and expiration,
  // so we trust the role claim directly from the token.
  return payload.role === 'admin';
}

// GET: List treatment prices with category filter
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyJWT(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const activeOnly = searchParams.get('active') !== 'false';

    const crm = getCRM();

    let sql: string;
    let args: (string | number)[] = [];

    if (category) {
      sql = activeOnly
        ? 'SELECT * FROM TreatmentPrice WHERE category = ? AND active = 1 ORDER BY category, name'
        : 'SELECT * FROM TreatmentPrice WHERE category = ? ORDER BY category, name';
      args = [category];
    } else {
      sql = activeOnly
        ? 'SELECT * FROM TreatmentPrice WHERE active = 1 ORDER BY category, name'
        : 'SELECT * FROM TreatmentPrice ORDER BY category, name';
    }

    const result = await crm.execute({ sql, args });

    const treatments = result.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      category: row.category as string | null,
      price: row.price as number,
      duration: row.duration as number,
      description: row.description as string | null,
      active: row.active as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));

    // Get unique categories
    const catResult = await crm.execute(
      'SELECT DISTINCT category FROM TreatmentPrice WHERE category IS NOT NULL AND active = 1 ORDER BY category'
    );
    const categories = catResult.rows.map((r) => r.category as string);

    return NextResponse.json({ treatments, categories });
  } catch (error) {
    console.error('List treatments error:', error);
    return NextResponse.json({ error: 'Failed to list treatments' }, { status: 500 });
  }
}

// POST: Add treatment price (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !isAdmin(token)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(createTreatmentSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const v = parsed.data;
    const crm = getCRM();

    const id = 'tp_' + crypto.randomBytes(12).toString('hex');

    await crm.execute({
      sql: `INSERT INTO TreatmentPrice (
        id, name, category, price, duration, description, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        v.name,
        v.category ?? null,
        v.price ?? 0,
        v.duration ?? 30,
        v.description ?? null,
        v.active !== undefined ? (v.active ? 1 : 0) : 1,
      ],
    });

    return NextResponse.json(
      { success: true, id, name: v.name, message: 'Treatment added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add treatment error:', error);
    return NextResponse.json({ error: 'Failed to add treatment' }, { status: 500 });
  }
}

// PUT: Update treatment price (admin only)
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !isAdmin(token)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(updateTreatmentSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const v = parsed.data;
    const crm = getCRM();

    const existing = await crm.execute({
      sql: 'SELECT id FROM TreatmentPrice WHERE id = ?',
      args: [v.id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    }

    const updatableFields = [
      'name', 'category', 'price', 'duration', 'description', 'active',
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
      sql: `UPDATE TreatmentPrice SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ success: true, message: 'Treatment updated successfully' });
  } catch (error) {
    console.error('Update treatment error:', error);
    return NextResponse.json({ error: 'Failed to update treatment' }, { status: 500 });
  }
}
