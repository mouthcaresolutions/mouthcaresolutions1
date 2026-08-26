import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { extractAuthToken, checkBodySize } from '@/lib/auth';
import { getCRM } from '@/lib/crm-db';
import { createAppointmentSchema, updateAppointmentSchema, validateBody } from '@/lib/validation';

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

// SEC-M08: All staff can read appointments
const READ_ROLES = ['admin', 'doctor', 'frontoffice'];
// SEC-M08: All staff can create/update appointments
const WRITE_ROLES = ['admin', 'doctor', 'frontoffice'];

// GET: List appointments with date, doctor, status filters
export async function GET(request: NextRequest) {
  try {
    const token = extractAuthToken(request);
    if (!token || !requireRole(token, READ_ROLES)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const doctorId = searchParams.get('doctorId') || '';
    const status = searchParams.get('status') || '';
    const patientId = searchParams.get('patientId') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const crm = getCRM();

    const whereClauses: string[] = [];
    const args: (string | number)[] = [];

    if (date) {
      whereClauses.push('a.date = ?');
      args.push(date);
    } else if (dateFrom && dateTo) {
      whereClauses.push('a.date >= ? AND a.date <= ?');
      args.push(dateFrom, dateTo);
    } else if (dateFrom) {
      whereClauses.push('a.date >= ?');
      args.push(dateFrom);
    } else if (dateTo) {
      whereClauses.push('a.date <= ?');
      args.push(dateTo);
    }

    if (doctorId) {
      whereClauses.push('a.doctorId = ?');
      args.push(doctorId);
    }

    if (status) {
      whereClauses.push('a.status = ?');
      args.push(status);
    }

    if (patientId) {
      whereClauses.push('a.patientId = ?');
      args.push(patientId);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count
    const countResult = await crm.execute({
      sql: `SELECT COUNT(*) as total FROM Appointment a ${whereSQL}`,
      args,
    });
    const total = (countResult.rows[0]?.total as number) ?? 0;

    // Data
    const result = await crm.execute({
      sql: `SELECT a.* FROM Appointment a ${whereSQL} ORDER BY a.date DESC, a.time DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const appointments = result.rows.map((row) => ({
      id: row.id as string,
      appointmentId: row.appointmentId as string,
      patientId: row.patientId as string,
      patientName: row.patientName as string,
      doctorId: row.doctorId as string | null,
      doctorName: row.doctorName as string | null,
      date: row.date as string,
      time: row.time as string,
      endTime: row.endTime as string | null,
      duration: row.duration as number,
      status: row.status as string,
      treatmentType: row.treatmentType as string | null,
      reason: row.reason as string | null,
      notes: row.notes as string | null,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));

    return NextResponse.json({
      appointments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List appointments error:', error);
    return NextResponse.json({ error: 'Failed to list appointments' }, { status: 500 });
  }
}

// POST: Book new appointment
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
    const parsed = validateBody(createAppointmentSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const v = parsed.data;
    const crm = getCRM();

    // Verify patient exists
    const patientResult = await crm.execute({
      sql: 'SELECT id, firstName, lastName FROM Patient WHERE id = ?',
      args: [v.patientId],
    });
    if (patientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patient = patientResult.rows[0];
    const patientName = `${patient.firstName}${patient.lastName ? ' ' + patient.lastName : ''}`;

    // Generate appointmentId atomically via subquery to avoid race condition
    const id = 'apt_' + crypto.randomBytes(12).toString('hex');

    // Get doctor name if doctorId provided
    let doctorName = v.doctorName ?? null;
    if (v.doctorId && !doctorName) {
      const docResult = await crm.execute({
        sql: 'SELECT name FROM CRMDoctor WHERE id = ?',
        args: [v.doctorId],
      });
      if (docResult.rows.length > 0) {
        doctorName = docResult.rows[0].name as string;
      }
    }

    // HIGH #8 FIX: Check for double-booking (same doctor, same date, same time)
    if (v.doctorId) {
      const sameSlotCheck = await crm.execute({
        sql: `SELECT id FROM Appointment 
             WHERE doctorId = ? AND date = ? AND time = ? AND status NOT IN ('cancelled', 'no-show')`,
        args: [v.doctorId, v.date, v.time],
      });
      if (sameSlotCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'This time slot is already booked for the selected doctor. Please choose a different time.' },
          { status: 409 },
        );
      }
    }

    await crm.execute({
      sql: `INSERT INTO Appointment (
        id, appointmentId, patientId, patientName, doctorId, doctorName,
        date, time, endTime, duration, status, treatmentType, reason, notes
      ) VALUES (
        ?,
        'MCS-APT-' || printf('%04d', COALESCE((SELECT MAX(CAST(SUBSTR(appointmentId, -4) AS INTEGER)) FROM Appointment WHERE appointmentId LIKE 'MCS-APT-%'), 0) + 1),
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      args: [
        id,
        v.patientId,
        patientName,
        v.doctorId ?? null,
        doctorName,
        v.date,
        v.time,
        v.endTime ?? null,
        v.duration ?? 30,
        'scheduled',
        v.treatmentType ?? null,
        v.reason ?? null,
        v.notes ?? null,
      ],
    });

    // Fetch the generated appointmentId for the response
    const inserted = await crm.execute({
      sql: 'SELECT appointmentId FROM Appointment WHERE id = ?',
      args: [id],
    });
    const appointmentId = inserted.rows[0]?.appointmentId as string;

    return NextResponse.json(
      {
        success: true,
        appointmentId,
        id,
        patientName,
        message: 'Appointment booked successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Book appointment error:', error);
    return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
  }
}

// PUT: Update appointment (status, notes, etc.)
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
    const parsed = validateBody(updateAppointmentSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const v = parsed.data;
    const crm = getCRM();

    const existing = await crm.execute({
      sql: 'SELECT id FROM Appointment WHERE id = ?',
      args: [v.id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const updatableFields = [
      'doctorId', 'doctorName', 'date', 'time', 'endTime', 'duration',
      'status', 'treatmentType', 'reason', 'notes', 'patientName',
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
      sql: `UPDATE Appointment SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ success: true, message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}
