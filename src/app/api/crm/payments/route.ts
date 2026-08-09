import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { validateSession } from '@/lib/auth';
import { getCRM } from '@/lib/crm-db';

// GET: List payments with filters
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const crm = getCRM();

    if (!body.patientId || !body.date || body.amount === undefined) {
      return NextResponse.json(
        { error: 'patientId, date, and amount are required' },
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

    // Generate sequential paymentId: MCS-PAY-NNNN
    const lastPayment = await crm.execute({
      sql: "SELECT paymentId FROM Payment WHERE paymentId LIKE 'MCS-PAY-%' ORDER BY paymentId DESC LIMIT 1",
      args: [],
    });

    let nextPayNum = 1;
    if (lastPayment.rows.length > 0) {
      const lastId = lastPayment.rows[0].paymentId as string;
      const lastNum = parseInt(lastId.replace('MCS-PAY-', ''), 10);
      if (!isNaN(lastNum)) {
        nextPayNum = lastNum + 1;
      }
    }
    const paymentId = `MCS-PAY-${String(nextPayNum).padStart(4, '0')}`;

    // Generate sequential invoiceNumber: INV-YYYY-NNNN
    const year = new Date().getFullYear().toString();
    const invPrefix = `INV-${year}-`;

    const lastInvoice = await crm.execute({
      sql: 'SELECT invoiceNumber FROM Payment WHERE invoiceNumber LIKE ? ORDER BY invoiceNumber DESC LIMIT 1',
      args: [`${invPrefix}%`],
    });

    let nextInvNum = 1;
    if (lastInvoice.rows.length > 0) {
      const lastInvId = lastInvoice.rows[0].invoiceNumber as string;
      const lastNum = parseInt(lastInvId.replace(invPrefix, ''), 10);
      if (!isNaN(lastNum)) {
        nextInvNum = lastNum + 1;
      }
    }
    const invoiceNumber = `${invPrefix}${String(nextInvNum).padStart(4, '0')}`;

    const id = 'pay_' + crypto.randomBytes(12).toString('hex');
    const amount = body.amount || 0;
    const paidAmount = body.paidAmount || 0;
    const balanceAmount = amount - paidAmount;

    let status = 'pending';
    if (paidAmount >= amount && amount > 0) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    await crm.execute({
      sql: `INSERT INTO Payment (
        id, paymentId, patientId, patientName, visitId, invoiceNumber,
        amount, paidAmount, balanceAmount, paymentMethod, status,
        date, dueDate, items, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        paymentId,
        body.patientId,
        patientName,
        body.visitId || null,
        invoiceNumber,
        amount,
        paidAmount,
        balanceAmount,
        body.paymentMethod || null,
        status,
        body.date,
        body.dueDate || null,
        body.items || null,
        body.notes || null,
      ],
    });

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
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const crm = getCRM();

    if (!body.id) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const existing = await crm.execute({
      sql: 'SELECT * FROM Payment WHERE id = ?',
      args: [body.id],
    });
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const current = existing.rows[0];
    let paidAmount = (current.paidAmount as number) || 0;
    let amount = (current.amount as number) || 0;

    // If markAsPaid is true, set paidAmount to amount
    if (body.markAsPaid) {
      paidAmount = amount;
    }

    // If addPayment is provided, add to paidAmount
    if (body.addPayment !== undefined && body.addPayment > 0) {
      paidAmount = Math.min(paidAmount + body.addPayment, amount);
    }

    // Allow direct update of paidAmount
    if (body.paidAmount !== undefined && !body.markAsPaid && body.addPayment === undefined) {
      paidAmount = body.paidAmount;
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

    if (body.paymentMethod !== undefined) {
      setClauses.push('paymentMethod = ?');
      args.push(body.paymentMethod || null);
    }

    if (body.notes !== undefined) {
      setClauses.push('notes = ?');
      args.push(body.notes || null);
    }

    if (body.dueDate !== undefined) {
      setClauses.push('dueDate = ?');
      args.push(body.dueDate || null);
    }

    if (body.items !== undefined) {
      setClauses.push('items = ?');
      args.push(body.items || null);
    }

    args.push(body.id);
    await crm.execute({
      sql: `UPDATE Payment SET ${setClauses.join(', ')} WHERE id = ?`,
      args,
    });

    // Update patient balanceDue
    await crm.execute({
      sql: `UPDATE Patient SET balanceDue = (
        SELECT COALESCE(SUM(balanceAmount), 0) FROM Payment WHERE patientId = Patient.id AND status IN ('pending', 'partial')
      ), updatedAt = CURRENT_TIMESTAMP
      WHERE id = (SELECT patientId FROM Payment WHERE id = ?)`,
      args: [body.id],
    });

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
