import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { validateSession } from '@/lib/auth';
import { getCRM } from '@/lib/crm-db';

// GET: List visits with patient filter, date filter
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const crm = getCRM();

    if (!body.patientId || !body.date) {
      return NextResponse.json(
        { error: 'patientId and date are required' },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patientResult = await crm.execute({
      sql: 'SELECT id, firstName, lastName FROM Patient WHERE id = ?',
      args: [body.patientId],
    });
    if (patientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patient = patientResult.rows[0];
    const patientName = `${patient.firstName}${patient.lastName ? ' ' + patient.lastName : ''}`;

    // Generate sequential visitId: MCS-VIS-NNNN
    const lastVisit = await crm.execute({
      sql: "SELECT visitId FROM PatientVisit WHERE visitId LIKE 'MCS-VIS-%' ORDER BY visitId DESC LIMIT 1",
      args: [],
    });

    let nextNum = 1;
    if (lastVisit.rows.length > 0) {
      const lastId = lastVisit.rows[0].visitId as string;
      const lastNum = parseInt(lastId.replace('MCS-VIS-', ''), 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }

    const visitId = `MCS-VIS-${String(nextNum).padStart(4, '0')}`;
    const id = 'vis_' + crypto.randomBytes(12).toString('hex');

    // Get doctor name if doctorId provided
    let doctorName = body.doctorName || null;
    if (body.doctorId && !doctorName) {
      const docResult = await crm.execute({
        sql: 'SELECT name FROM CRMDoctor WHERE id = ?',
        args: [body.doctorId],
      });
      if (docResult.rows.length > 0) {
        doctorName = docResult.rows[0].name as string;
      }
    }

    const totalAmount = body.totalAmount || 0;
    const discount = body.discount || 0;

    // Insert visit
    await crm.execute({
      sql: `INSERT INTO PatientVisit (
        id, visitId, patientId, patientName, doctorId, doctorName,
        appointmentId, date, chiefComplaint, diagnosis, treatmentDone,
        prescription, notes, followUpDate, totalAmount, discount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        visitId,
        body.patientId,
        patientName,
        body.doctorId || null,
        doctorName,
        body.appointmentId || null,
        body.date,
        body.chiefComplaint || null,
        body.diagnosis || null,
        body.treatmentDone || null,
        body.prescription || null,
        body.notes || null,
        body.followUpDate || null,
        totalAmount,
        discount,
      ],
    });

    // Update patient stats
    const netAmount = totalAmount - discount;
    await crm.execute({
      sql: `UPDATE Patient SET 
        totalVisits = totalVisits + 1, 
        totalSpent = totalSpent + ?, 
        lastVisitDate = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?`,
      args: [netAmount, body.date, body.patientId],
    });

    // Update appointment status to completed if appointmentId is provided
    if (body.appointmentId) {
      await crm.execute({
        sql: "UPDATE Appointment SET status = 'completed', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        args: [body.appointmentId],
      });
    }

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
