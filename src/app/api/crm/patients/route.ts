import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { validateSession } from '@/lib/auth';
import { getCRM } from '@/lib/crm-db';

// GET: List patients with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const crm = getCRM();

    // Generate sequential patientId: MCS-YYYY-NNN
    const year = new Date().getFullYear().toString();
    const prefix = `MCS-${year}-`;

    const lastPatient = await crm.execute({
      sql: 'SELECT patientId FROM Patient WHERE patientId LIKE ? ORDER BY patientId DESC LIMIT 1',
      args: [`${prefix}%`],
    });

    let nextNum = 1;
    if (lastPatient.rows.length > 0) {
      const lastId = lastPatient.rows[0].patientId as string;
      const lastNum = parseInt(lastId.replace(prefix, ''), 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }

    const patientId = `${prefix}${String(nextNum).padStart(3, '0')}`;
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
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      args: [
        id,
        patientId,
        body.firstName || '',
        body.lastName || null,
        body.phone || '',
        body.phone2 || null,
        body.email || null,
        body.dateOfBirth || null,
        body.age || null,
        body.gender || null,
        body.bloodGroup || null,
        body.address || null,
        body.city || 'Vijayawada',
        body.state || 'Andhra Pradesh',
        body.pincode || null,
        body.occupation || null,
        body.referredBy || null,
        body.medicalHistory || null,
        body.dentalHistory || null,
        body.allergies || null,
        body.currentMedications || null,
        body.emergencyContactName || null,
        body.emergencyContactPhone || null,
        body.insuranceProvider || null,
        body.insuranceNumber || null,
        body.category || 'New',
        body.photo || null,
        body.notes || null,
        0,
        0,
        0,
      ],
    });

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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const crm = getCRM();

    if (!body.id) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Check patient exists
    const existing = await crm.execute({
      sql: 'SELECT id FROM Patient WHERE id = ?',
      args: [body.id],
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
      if (body[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        args.push(body[field] === '' ? null : body[field]);
      }
    }

    if (setClauses.length <= 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    args.push(body.id);
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
