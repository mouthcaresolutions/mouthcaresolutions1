import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireRole, extractAuthToken, checkBodySize } from '@/lib/auth';
import { getCRM } from '@/lib/crm-db';
import { createPaymentSchema, updatePaymentSchema, validateBody } from '@/lib/validation';

// SEC-M08: All staff can read payments
const READ_ROLES = ['admin', 'doctor', 'frontoffice'];
// SEC-M08: Only admin and frontoffice can create/update payments
const WRITE_ROLES = ['admin', 'frontoffice'];

// GET: List payments with filters
export async function GET(request: NextRequest) {
  try {
    const token = extractAuthToken(request);
    if (!token || !requireRole(token, READ_ROLES)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
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

    if (status) {
      whereClauses.push('status = ?');
      args.push(status);
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

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count
    const countResult = await crm.execute({
      sql: `SELECT COUNT(*) as total FROM Payment ${whereSQL}`,
      args,
    });
    const total = (countResult.rows[0]?.total as number) ?? 0;

    // Data
    const result = await crm.execute({
      sql: `SELECT * FROM Payment ${whereSQL} ORDER BY date DESC, createdAt DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const payments = result.rows.map((row) => ({
      id: row.id as string,
      paymentId: row.paymentId as string,
      patientId: row.patientId as string,
      patientName: row.patientName as string,
      visitId: row.visitId as string | null,
      invoiceNumber: row.invoiceNumber as string,
      amount: row.amount as number,
      paidAmount: row.paidAmount as number,
      balanceAmount: row.balanceAmount as number,
      paymentMethod: row.paymentMethod as string | null,
      status: row.status as string,
      date: row.date as string,
      dueDate: row.dueDate as string | null,
      items: row.items as string | null,
      notes: row.notes as string | null,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));

    return NextResponse.json({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List payments error:', error);
    return NextResponse.json({ error: 'Failed to list payments' }, { status: 500 });
  }
}

// POST: Create payment/invoice
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
    const parsed = validateBody(createPaymentSchema, body);
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

    // Generate paymentId and invoiceNumber atomically via subqueries to avoid race conditions
    const year = new Date().getFullYear().toString();
    const id = 'pay_' + crypto.randomBytes(12).toString('hex');
    const amount = v.amount;
    const paidAmount = v.paidAmount ?? 0;
    const balanceAmount = amount - paidAmount;

    let status = 'pending';
    if (paidAmount >= amount && amount > 0) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    // Batch the payment INSERT + patient balanceDue UPDATE for atomicity
    await crm.batch([
      {
        sql: `INSERT INTO Payment (
          id, paymentId, patientId, patientName, visitId, invoiceNumber,
          amount, paidAmount, balanceAmount, paymentMethod, status,
          date, dueDate, items, notes
        ) VALUES (
          ?,
          'MCS-PAY-' || printf('%04d', COALESCE((SELECT MAX(CAST(SUBSTR(paymentId, -4) AS INTEGER)) FROM Payment WHERE paymentId LIKE 'MCS-PAY-%'), 0) + 1),
          ?, ?, ?,
          'INV-' || ? || '-' || printf('%04d', COALESCE((SELECT MAX(CAST(SUBSTR(invoiceNumber, -4) AS INTEGER)) FROM Payment WHERE invoiceNumber LIKE 'INV-' || ? || '-%'), 0) + 1),
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        args: [
          id,
          v.patientId,
          patientName,
          v.visitId ?? null,
          year,
          year,
          amount,
          paidAmount,
          balanceAmount,
          v.paymentMethod ?? null,
          status,
          v.date,
          v.dueDate ?? null,
          v.items ?? null,
          v.notes ?? null,
        ],
      },
      {
        sql: `UPDATE Patient SET 
          balanceDue = (SELECT COALESCE(SUM(balanceAmount), 0) FROM Payment WHERE patientId = Patient.id AND status IN ('pending', 'partial')),
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        args: [v.patientId],
      },
    ]);

    // Fetch the generated paymentId and invoiceNumber for the response
    const inserted = await crm.execute({
      sql: 'SELECT paymentId, invoiceNumber FROM Payment WHERE id = ?',
      args: [id],
    });
    const paymentId = inserted.rows[0]?.paymentId as string;
    const invoiceNumber = inserted.rows[0]?.invoiceNumber as string;

    return NextResponse.json(
      {
        success: true,
        paymentId,
        invoiceNumber,
        id,
        patientName,
        status,
        message: 'Payment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

// PUT: Update payment (mark as paid, add payment)
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
    const parsed = validateBody(updatePaymentSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const v = parsed.data;
    const crm = getCRM();

    const existing = await crm.execute({
      sql: 'SELECT * FROM Payment WHERE id = ?',
      args: [v.id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const current = existing.rows[0];
    let paidAmount = (current.paidAmount as number) || 0;
    let amount = (current.amount as number) || 0;

    // If markAsPaid is true, set paidAmount to amount
    if (v.markAsPaid) {
      paidAmount = amount;
    }

    // If addPayment is provided, add to paidAmount
    if (v.addPayment !== undefined && v.addPayment > 0) {
      paidAmount = Math.min(paidAmount + v.addPayment, amount);
    }

    // Allow direct update of paidAmount
    if (v.paidAmount !== undefined && !v.markAsPaid && v.addPayment === undefined) {
      paidAmount = v.paidAmount;
    }

    const balanceAmount = amount - paidAmount;
    let status: string = 'pending';
    if (paidAmount >= amount && amount > 0) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    const setClauses: string[] = [];
    const args: (string | number | null)[] = [];

    setClauses.push('paidAmount = ?');
    args.push(paidAmount);
    setClauses.push('balanceAmount = ?');
    args.push(balanceAmount);
    setClauses.push('status = ?');
    args.push(status);
    setClauses.push('updatedAt = CURRENT_TIMESTAMP');

    if (v.paymentMethod !== undefined) {
      setClauses.push('paymentMethod = ?');
      args.push(v.paymentMethod || null);
    }

    if (v.notes !== undefined) {
      setClauses.push('notes = ?');
      args.push(v.notes || null);
    }

    if (v.dueDate !== undefined) {
      setClauses.push('dueDate = ?');
      args.push(v.dueDate || null);
    }

    if (v.items !== undefined) {
      setClauses.push('items = ?');
      args.push(v.items || null);
    }

    // Update payment + patient balanceDue atomically via batch
    await crm.batch([
      {
        sql: `UPDATE Payment SET ${setClauses.join(', ')} WHERE id = ?`,
        args,
      },
      {
        sql: `UPDATE Patient SET balanceDue = (
          SELECT COALESCE(SUM(balanceAmount), 0) FROM Payment WHERE patientId = Patient.id AND status IN ('pending', 'partial')
        ), updatedAt = CURRENT_TIMESTAMP
        WHERE id = (SELECT patientId FROM Payment WHERE id = ?)`,
        args: [v.id],
      },
    ]);

    return NextResponse.json({
      success: true,
      status,
      paidAmount,
      balanceAmount,
      message: 'Payment updated successfully',
    });
  } catch (error) {
    console.error('Update payment error:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
