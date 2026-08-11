import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getCRM } from '@/lib/crm-db';

// GET: Single patient with all visits, payments, and appointment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !(await validateSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const crm = getCRM();

    // Get patient
    const patientResult = await crm.execute({
      sql: 'SELECT * FROM Patient WHERE id = ?',
      args: [id],
    });

    if (patientResult.rows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patient = patientResult.rows[0];

    // Get all appointments
    const appointmentsResult = await crm.execute({
      sql: 'SELECT * FROM Appointment WHERE patientId = ? ORDER BY date DESC, time DESC',
      args: [id],
    });

    const appointments = appointmentsResult.rows.map((row) => ({
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

    // Get all visits (clinical records)
    const visitsResult = await crm.execute({
      sql: 'SELECT * FROM PatientVisit WHERE patientId = ? ORDER BY date DESC',
      args: [id],
    });

    const visits = visitsResult.rows.map((row) => ({
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

    // Get all payments
    const paymentsResult = await crm.execute({
      sql: 'SELECT * FROM Payment WHERE patientId = ? ORDER BY date DESC',
      args: [id],
    });

    const payments = paymentsResult.rows.map((row) => ({
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
      patient: {
        id: patient.id as string,
        patientId: patient.patientId as string,
        firstName: patient.firstName as string,
        lastName: patient.lastName as string | null,
        phone: patient.phone as string,
        phone2: patient.phone2 as string | null,
        email: patient.email as string | null,
        dateOfBirth: patient.dateOfBirth as string | null,
        age: patient.age as number | null,
        gender: patient.gender as string | null,
        bloodGroup: patient.bloodGroup as string | null,
        address: patient.address as string | null,
        city: patient.city as string | null,
        state: patient.state as string | null,
        pincode: patient.pincode as string | null,
        occupation: patient.occupation as string | null,
        referredBy: patient.referredBy as string | null,
        medicalHistory: patient.medicalHistory as string | null,
        dentalHistory: patient.dentalHistory as string | null,
        allergies: patient.allergies as string | null,
        currentMedications: patient.currentMedications as string | null,
        emergencyContactName: patient.emergencyContactName as string | null,
        emergencyContactPhone: patient.emergencyContactPhone as string | null,
        insuranceProvider: patient.insuranceProvider as string | null,
        insuranceNumber: patient.insuranceNumber as string | null,
        category: patient.category as string | null,
        photo: patient.photo as string | null,
        notes: patient.notes as string | null,
        totalVisits: patient.totalVisits as number,
        totalSpent: patient.totalSpent as number,
        balanceDue: patient.balanceDue as number,
        lastVisitDate: patient.lastVisitDate as string | null,
        createdAt: patient.createdAt as string,
        updatedAt: patient.updatedAt as string,
      },
      appointments,
      visits,
      payments,
    });
  } catch (error) {
    console.error('Get patient detail error:', error);
    return NextResponse.json({ error: 'Failed to load patient details' }, { status: 500 });
  }
}
