import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getCRM } from '@/lib/crm-db';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const crm = getCRM();
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear().toString();
    const monthStart = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

    // Total patients
    const patientCount = await crm.execute('SELECT COUNT(*) as count FROM Patient');
    const totalPatients = patientCount.rows[0]?.count as number ?? 0;

    // Today's appointments count
    const todayAppts = await crm.execute({
      sql: 'SELECT COUNT(*) as count FROM Appointment WHERE date = ?',
      args: [today],
    });
    const todayAppointments = todayAppts.rows[0]?.count as number ?? 0;

    // Today's revenue (paid payments today)
    const todayRevenue = await crm.execute({
      sql: "SELECT COALESCE(SUM(paidAmount), 0) as total FROM Payment WHERE date = ? AND status = 'paid'",
      args: [today],
    });
    const todayRevenueTotal = (todayRevenue.rows[0]?.total as number) ?? 0;

    // Pending payments
    const pendingPay = await crm.execute({
      sql: "SELECT COALESCE(SUM(balanceAmount), 0) as total FROM Payment WHERE status IN ('pending', 'partial')",
      args: [],
    });
    const pendingPayments = (pendingPay.rows[0]?.total as number) ?? 0;

    // New patients this month
    const newPatientsMonth = await crm.execute({
      sql: 'SELECT COUNT(*) as count FROM Patient WHERE createdAt >= ? AND category = ? OR (createdAt >= ? AND category IS NULL)',
      args: [monthStart, 'New', monthStart],
    });
    // Simpler query for new patients this month
    const newPm = await crm.execute({
      sql: 'SELECT COUNT(*) as count FROM Patient WHERE createdAt >= ?',
      args: [monthStart],
    });
    const newPatientsThisMonth = newPm.rows[0]?.count as number ?? 0;

    // Appointment status breakdown
    const statusBreakdown = await crm.execute(
      'SELECT status, COUNT(*) as count FROM Appointment GROUP BY status'
    );
    const appointmentStatusBreakdown: Record<string, number> = {};
    for (const row of statusBreakdown.rows) {
      appointmentStatusBreakdown[row.status as string] = row.count as number;
    }

    // Revenue last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const revenue7Days = await crm.execute({
      sql: `SELECT date, COALESCE(SUM(paidAmount), 0) as total 
           FROM Payment 
           WHERE date >= ? AND date <= ? AND status = 'paid'
           GROUP BY date 
           ORDER BY date`,
      args: [sevenDaysAgoStr, today],
    });
    const revenueLast7Days = revenue7Days.rows.map((row) => ({
      date: row.date as string,
      revenue: row.total as number,
    }));

    // Recent 10 patients
    const recentPatients = await crm.execute({
      sql: 'SELECT id, patientId, firstName, lastName, phone, category, totalVisits, totalSpent, lastVisitDate, createdAt FROM Patient ORDER BY createdAt DESC LIMIT 10',
      args: [],
    });
    const recentPatientsList = recentPatients.rows.map((row) => ({
      id: row.id as string,
      patientId: row.patientId as string,
      firstName: row.firstName as string,
      lastName: row.lastName as string | null,
      phone: row.phone as string,
      category: row.category as string | null,
      totalVisits: row.totalVisits as number,
      totalSpent: row.totalSpent as number,
      lastVisitDate: row.lastVisitDate as string | null,
      createdAt: row.createdAt as string,
    }));

    // Today's appointment list with doctor names
    const todayApptList = await crm.execute({
      sql: 'SELECT id, appointmentId, patientId, patientName, doctorId, doctorName, time, status, treatmentType, reason FROM Appointment WHERE date = ? ORDER BY time',
      args: [today],
    });
    const todayAppointmentsList = todayApptList.rows.map((row) => ({
      id: row.id as string,
      appointmentId: row.appointmentId as string,
      patientId: row.patientId as string,
      patientName: row.patientName as string,
      doctorId: row.doctorId as string | null,
      doctorName: row.doctorName as string | null,
      time: row.time as string,
      status: row.status as string,
      treatmentType: row.treatmentType as string | null,
      reason: row.reason as string | null,
    }));

    return NextResponse.json({
      totalPatients,
      todayAppointments,
      todayRevenue: todayRevenueTotal,
      pendingPayments,
      newPatientsThisMonth,
      appointmentStatusBreakdown,
      revenueLast7Days,
      recentPatients: recentPatientsList,
      todayAppointmentsList,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
