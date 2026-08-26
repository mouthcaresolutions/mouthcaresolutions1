import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { extractAuthToken, checkBodySize } from '@/lib/auth';
import { getCRM } from '@/lib/crm-db';
import { createPatientSchema, updatePatientSchema, validateBody } from '@/lib/validation';

function verifyToken(token: string | undefined | null): { username: string; role: string; name: string } | null {
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature.length !== expectedSig.length) return null;
    let result = 0;
    for (let i = 0; i < signature.length; i++) { result |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i); }
    if (result !== 0) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { username: payload.username, role: payload.role, name: payload.name };
  } catch { return null; }
}

function requireRole(token: string, allowedRoles: string[]): { username: string; role: string; name: string } | null {
  const user = verifyToken(token);
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) return null;
  return user;
}

// SEC-M08: All roles (admin, doctor, frontoffice) can read patient data
const READ_ROLES = ['admin', 'doctor', 'frontoffice'];
// SEC-M08: Only admin and frontoffice can create/update patients
const WRITE_ROLES = ['admin', 'frontoffice'];

// GET: List patients with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const token = extractAuthToken(request);
    if (!token || !requireRole(token, READ_ROLES)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const crm = getCRM();

    let whereClauses: string[] = [];
    let args: (string | number)[] = [];

    if (search) {
      whereClauses.push(
        '(firstName LIKE ? OR lastName LIKE ? OR phone LIKE ? OR email LIKE ? OR patientId LIKE ?)'
      );
      const searchPattern = `%${search}%`;
      args.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (category) {
      whereClauses.push('category = ?');
      args.push(category);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count
    const countResult = await crm.execute({
      sql: `SELECT COUNT(*) as total FROM Patient ${whereSQL}`,
      args,
    });
    const total = (countResult.rows[0]?.total as number) ?? 0;

    // Get patients
    const result = await crm.execute({
      sql: `SELECT * FROM Patient ${whereSQL} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const patients = result.rows.map((row) => ({
      id: row.id as string,
      patientId: row.patientId as string,
      firstName: row.firstName as string,
      lastName: row.lastName as string | null,
      phone: row.phone as string,
      phone2: row.phone2 as string | null,
      email: row.email as string | null,
      dateOfBirth: row.dateOfBirth as string | null,
      age: row.age as number | null,
      gender: row.gender as string | null,
      bloodGroup: row.bloodGroup as string | null,
      address: row.address as string | null,
      city: row.city as string | null,
      state: row.state as string | null,
      pincode: row.pincode as string | null,
      occupation: row.occupation as string | null,
      referredBy: row.referredBy as string | null,
      medicalHistory: row.medicalHistory as string | null,
      dentalHistory: row.dentalHistory as string | null,
      allergies: row.allergies as string | null,
      currentMedications: row.currentMedications as string | null,
      emergencyContactName: row.emergencyContactName as string | null,
      emergencyContactPhone: row.emergencyContactPhone as string | null,
      insuranceProvider: row.insuranceProvider as string | null,
      insuranceNumber: row.insuranceNumber as string | null,
      category: row.category as string | null,
      photo: row.photo as string | null,
      notes: row.notes as string | null,
      totalVisits: row.totalVisits as number,
      totalSpent: row.totalSpent as number,
      balanceDue: row.balanceDue as number,
      lastVisitDate: row.lastVisitDate as string | null,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List patients error:', error);
    return NextResponse.json({ error: 'Failed to list patients' }, { status: 500 });
  }
}

// POST: Register new patient
export async function POST(request: NextRequest) {
  try {
    // SEC-L04: Body size check
    const sizeCheck = checkBodySize(request);
    if (sizeCheck) return sizeCheck as NextResponse;

    const token = extractAuthToken(request);
    if (!token || !requireRole(token, WRITE_ROLES)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(createPatientSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const v = parsed.data;
    const crm = getCRM();

    // Generate sequential patientId atomically via subquery to avoid race condition
    const year = new Date().getFullYear().toString();
    const id = 'pat_' + crypto.randomBytes(12).toString('hex');

    await crm.execute({
      sql: `INSERT INTO Patient (
        id, patientId, firstName, lastName, phone, phone2, email,
        dateOfBirth, age, gender, bloodGroup, address, city, state,
        pincode, occupation, referredBy, medicalHistory, dentalHistory,
        allergies, currentMedications, emergencyContactName,
        emergencyContactPhone, insuranceProvider, insuranceNumber,
        category, photo, notes, totalVisits, totalSpent, balanceDue
      ) VALUES (
        ?,
        'MCS-' || ? || '-' || printf('%03d', COALESCE((SELECT MAX(CAST(SUBSTR(patientId, -3) AS INTEGER)) FROM Patient WHERE patientId LIKE 'MCS-' || ? || '-%'), 0) + 1),
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      args: [
        id,
        year,
        year,
        v.firstName,
        v.lastName ?? null,
        v.phone,
        v.phone2 ?? null,
        v.email ?? null,
        v.dateOfBirth ?? null,
        v.age ?? null,
        v.gender ?? null,
        v.bloodGroup ?? null,
        v.address ?? null,
        v.city ?? 'Vijayawada',
        v.state ?? 'Andhra Pradesh',
        v.pincode ?? null,
        v.occupation ?? null,
        v.referredBy ?? null,
        v.medicalHistory ?? null,
        v.dentalHistory ?? null,
        v.allergies ?? null,
        v.currentMedications ?? null,
        v.emergencyContactName ?? null,
        v.emergencyContactPhone ?? null,
        v.insuranceProvider ?? null,
        v.insuranceNumber ?? null,
        v.category || 'New',
        null, // photo
        v.notes ?? null,
        0,
        0,
        0,
      ],
    });

    // Fetch the generated patientId for the response
    const inserted = await crm.execute({
      sql: 'SELECT patientId FROM Patient WHERE id = ?',
      args: [id],
    });
    const patientId = inserted.rows[0]?.patientId as string;

    return NextResponse.json({
      success: true,
      patientId,
      id,
      message: 'Patient registered successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Register patient error:', error);
    return NextResponse.json({ error: 'Failed to register patient' }, { status: 500 });
  }
}

// PUT: Update patient
export async function PUT(request: NextRequest) {
  try {
    // SEC-L04: Body size check
    const sizeCheck = checkBodySize(request);
    if (sizeCheck) return sizeCheck as NextResponse;

    const token = extractAuthToken(request);
    if (!token || !requireRole(token, WRITE_ROLES)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = validateBody(updatePatientSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const v = parsed.data;
    const crm = getCRM();

    // Check patient exists
    const existing = await crm.execute({
      sql: 'SELECT id FROM Patient WHERE id = ?',
      args: [v.id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const updatableFields = [
      'firstName', 'lastName', 'phone', 'phone2', 'email', 'dateOfBirth',
      'age', 'gender', 'bloodGroup', 'address', 'city', 'state', 'pincode',
      'occupation', 'referredBy', 'medicalHistory', 'dentalHistory', 'allergies',
      'currentMedications', 'emergencyContactName', 'emergencyContactPhone',
      'insuranceProvider', 'insuranceNumber', 'category', 'photo', 'notes',
    ];

    const setClauses: string[] = ['updatedAt = CURRENT_TIMESTAMP'];
    const args: (string | number | null)[] = [];

    for (const field of updatableFields) {
      const val = (v as Record<string, unknown>)[field] as string | number | null | undefined;
      if (val !== undefined) {
        setClauses.push(`${field} = ?`);
        args.push(val === '' ? null : val);
      }
    }

    if (setClauses.length <= 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    args.push(v.id);
    await crm.execute({
      sql: `UPDATE Patient SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    });

    return NextResponse.json({
      success: true,
      message: 'Patient updated successfully',
    });
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

// DELETE: Not allowed
export async function DELETE() {
  return NextResponse.json(
    { error: 'Patient deletion is not allowed. Contact administrator.' },
    { status: 403 }
  );
}
