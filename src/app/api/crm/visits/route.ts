import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { extractAuthToken, checkBodySize } from '@/lib/auth';
import { getCRM } from '@/lib/crm-db';
import { createVisitSchema, validateBody } from '@/lib/validation';

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

// SEC-M08: All clinical staff can read visits
const READ_ROLES = ['admin', 'doctor', 'frontoffice'];
// SEC-M08: Only admin and doctor can create visit records
const WRITE_ROLES = ['admin', 'doctor'];

// GET: List visits with patient filter, date filter
export async function GET(request: NextRequest) {
  try {
    const token = extractAuthToken(request);
    if (!token || !requireRole(token, READ_ROLES)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const doctorId = searchParams.get('doctorId') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    const crm = getCRM();

    const whereClauses: string[] = [];
    const args: (string | number)[] = [];

    if (patientId) {
      whereClauses.push('patientId = ?');
      args.push(patientId);
    }

    if (dateFrom && dateTo) {
      whereClauses.push('date >= ? AND date <= ?');
      args.push(dateFrom, dateTo);
    } else if (dateFrom) {
      whereClauses.push('date >= ?');
      args.push(dateFrom);
    } else if (dateTo) {
      whereClauses.push('date <= ?');
      args.push(dateTo);
    }

    if (doctorId) {
      whereClauses.push('doctorId = ?');
      args.push(doctorId);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count
    const countResult = await crm.execute({
      sql: `SELECT COUNT(*) as total FROM PatientVisit ${whereSQL}`,
      args,
    });
    const total = (countResult.rows[0]?.total as number) ?? 0;

    // Data
    const result = await crm.execute({
      sql: `SELECT * FROM PatientVisit ${whereSQL} ORDER BY date DESC, createdAt DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const visits = result.rows.map((row) => ({
      id: row.id as string,
      visitId: row.visitId as string,
      patientId: row.patientId as string,
      patientName: row.patientName as string,
      doctorId: row.doctorId as string | null,
      doctorName: row.doctorName as string | null,
      appointmentId: row.appointmentId as string | null,
      date: row.date as string,
      chiefComplaint: row.chiefComplaint as string | null,
      diagnosis: row.diagnosis as string | null,
      treatmentDone: row.treatmentDone as string | null,
      prescription: row.prescription as string | null,
      notes: row.notes as string | null,
      followUpDate: row.followUpDate as string | null,
      totalAmount: row.totalAmount as number,
      discount: row.discount as number,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));

    return NextResponse.json({
      visits,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List visits error:', error);
    return NextResponse.json({ error: 'Failed to list visits' }, { status: 500 });
  }
}

// POST: Create new visit (clinical record)
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
    const parsed = validateBody(createVisitSchema, body);
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

    // Generate visitId atomically via subquery to avoid race condition
    const id = 'vis_' + crypto.randomBytes(12).toString('hex');

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

    const totalAmount = v.totalAmount ?? 0;
    const discount = v.discount ?? 0;
    const netAmount = totalAmount - discount;

    // Batch the visit INSERT + patient stats UPDATE + optional appointment status UPDATE
    // to ensure atomicity (no partial state if one operation fails)
    const batchStatements: { sql: string; args: (string | number | null)[] }[] = [
      {
        sql: `INSERT INTO PatientVisit (
          id, visitId, patientId, patientName, doctorId, doctorName,
          appointmentId, date, chiefComplaint, diagnosis, treatmentDone,
          prescription, notes, followUpDate, totalAmount, discount
        ) VALUES (
          ?,
          'MCS-VIS-' || printf('%04d', COALESCE((SELECT MAX(CAST(SUBSTR(visitId, -4) AS INTEGER)) FROM PatientVisit WHERE visitId LIKE 'MCS-VIS-%'), 0) + 1),
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        args: [
          id,
          v.patientId,
          patientName,
          v.doctorId ?? null,
          doctorName,
          v.appointmentId ?? null,
          v.date,
          v.chiefComplaint ?? null,
          v.diagnosis ?? null,
          v.treatmentDone ?? null,
          v.prescription ?? null,
          v.notes ?? null,
          v.followUpDate ?? null,
          totalAmount,
          discount,
        ],
      },
      {
        sql: `UPDATE Patient SET 
          totalVisits = totalVisits + 1, 
          totalSpent = totalSpent + ?, 
          lastVisitDate = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        args: [netAmount, v.date, v.patientId],
      },
    ];

    if (v.appointmentId) {
      batchStatements.push({
        sql: "UPDATE Appointment SET status = 'completed', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        args: [v.appointmentId],
      });
    }

    await crm.batch(batchStatements);

    // Fetch the generated visitId for the response
    const inserted = await crm.execute({
      sql: 'SELECT visitId FROM PatientVisit WHERE id = ?',
      args: [id],
    });
    const visitId = inserted.rows[0]?.visitId as string;

    return NextResponse.json(
      {
        success: true,
        visitId,
        id,
        patientName,
        message: 'Visit created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create visit error:', error);
    return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 });
  }
}
