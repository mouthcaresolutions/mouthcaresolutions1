import { z } from 'zod/v4';

// ---------- Common helpers ----------
const idField = z.string().min(1, 'ID is required');

const indianPhone = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number');

const emailField = z
  .string()
  .email('Invalid email address')
  .max(200, 'Email too long')
  .nullable()
  .optional();

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

const timeField = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format');

const nullableString = z.string().max(2000).nullable().optional();
const nullableShortString = z.string().max(500).nullable().optional();

// ---------- Patient ----------
export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().max(100, 'Last name too long').nullable().optional(),
  phone: indianPhone,
  phone2: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number')
    .nullable()
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(200, 'Email too long')
    .nullable()
    .optional(),
  dateOfBirth: dateField.nullable().optional(),
  age: z.number().int().min(0).max(150).nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .nullable()
    .optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .nullable()
    .optional(),
  occupation: z.string().max(100).nullable().optional(),
  referredBy: z.string().max(200).nullable().optional(),
  medicalHistory: z.string().max(5000).nullable().optional(),
  dentalHistory: z.string().max(5000).nullable().optional(),
  allergies: z.string().max(2000).nullable().optional(),
  currentMedications: z.string().max(2000).nullable().optional(),
  emergencyContactName: z.string().max(100).nullable().optional(),
  emergencyContactPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number')
    .nullable()
    .optional(),
  category: z.enum(['New', 'Existing', 'VIP', 'Inactive']).optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const updatePatientSchema = z.object({
  id: idField,
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().max(100, 'Last name too long').nullable().optional(),
  phone: indianPhone.optional(),
  phone2: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number')
    .nullable()
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(200, 'Email too long')
    .nullable()
    .optional(),
  dateOfBirth: dateField.nullable().optional(),
  age: z.number().int().min(0).max(150).nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .nullable()
    .optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .nullable()
    .optional(),
  occupation: z.string().max(100).nullable().optional(),
  referredBy: z.string().max(200).nullable().optional(),
  medicalHistory: z.string().max(5000).nullable().optional(),
  dentalHistory: z.string().max(5000).nullable().optional(),
  allergies: z.string().max(2000).nullable().optional(),
  currentMedications: z.string().max(2000).nullable().optional(),
  emergencyContactName: z.string().max(100).nullable().optional(),
  emergencyContactPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number')
    .nullable()
    .optional(),
  category: z.enum(['New', 'Existing', 'VIP', 'Inactive']).optional(),
  notes: z.string().max(5000).nullable().optional(),
});

// ---------- Appointment ----------
const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'] as const;

export const createAppointmentSchema = z.object({
  patientId: idField,
  date: dateField,
  time: timeField,
  endTime: timeField.nullable().optional(),
  duration: z.number().int().min(5).max(480).optional(),
  doctorId: z.string().max(100).nullable().optional(),
  doctorName: z.string().max(100).nullable().optional(),
  treatmentType: z.string().max(200).nullable().optional(),
  reason: z.string().max(1000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const updateAppointmentSchema = z.object({
  id: idField,
  date: dateField.optional(),
  time: timeField.optional(),
  endTime: timeField.nullable().optional(),
  duration: z.number().int().min(5).max(480).optional(),
  doctorId: z.string().max(100).nullable().optional(),
  doctorName: z.string().max(100).nullable().optional(),
  patientName: z.string().max(200).nullable().optional(),
  status: z.enum(validStatuses).optional(),
  treatmentType: z.string().max(200).nullable().optional(),
  reason: z.string().max(1000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

// ---------- Visit ----------
export const createVisitSchema = z.object({
  patientId: idField,
  date: dateField,
  doctorId: z.string().max(100).nullable().optional(),
  doctorName: z.string().max(100).nullable().optional(),
  appointmentId: z.string().max(100).nullable().optional(),
  chiefComplaint: z.string().max(2000).nullable().optional(),
  diagnosis: z.string().max(2000).nullable().optional(),
  treatmentDone: z.string().max(5000).nullable().optional(),
  prescription: z.string().max(5000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  followUpDate: dateField.nullable().optional(),
  totalAmount: z.number().min(0).max(5000000).optional(),
  discount: z.number().min(0).max(5000000).optional(),
});

// ---------- Payment ----------
const validPaymentMethods = ['cash', 'upi', 'card', 'bank-transfer', 'other'] as const;
const validPaymentStatuses = ['pending', 'partial', 'paid', 'overdue', 'cancelled'] as const;

export const createPaymentSchema = z.object({
  patientId: idField,
  date: dateField,
  amount: z.number().min(0, 'Amount must be non-negative').max(5000000, 'Amount too large'),
  paidAmount: z.number().min(0, 'Paid amount must be non-negative').max(5000000).optional(),
  visitId: z.string().max(100).nullable().optional(),
  paymentMethod: z.enum(validPaymentMethods).nullable().optional(),
  dueDate: dateField.nullable().optional(),
  items: z.string().max(10000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const updatePaymentSchema = z.object({
  id: idField,
  markAsPaid: z.boolean().optional(),
  addPayment: z.number().min(0, 'Payment must be non-negative').max(5000000).optional(),
  paidAmount: z.number().min(0).max(5000000).optional(),
  paymentMethod: z.enum(validPaymentMethods).nullable().optional(),
  dueDate: dateField.nullable().optional(),
  items: z.string().max(10000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

// ---------- Doctor ----------
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const createDoctorSchema = z.object({
  name: z.string().min(1, 'Doctor name is required').max(100, 'Name too long'),
  specialization: z.string().max(200).nullable().optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number')
    .nullable()
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(200, 'Email too long')
    .nullable()
    .optional(),
  availableDays: z.string().max(100).nullable().optional(),
  startTime: timeField.optional(),
  endTime: timeField.optional(),
  slotDuration: z.number().int().min(5).max(120).optional(),
  active: z.boolean().optional(),
});

export const updateDoctorSchema = z.object({
  id: idField,
  name: z.string().min(1, 'Doctor name is required').max(100, 'Name too long').optional(),
  specialization: z.string().max(200).nullable().optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number')
    .nullable()
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .max(200, 'Email too long')
    .nullable()
    .optional(),
  availableDays: z.string().max(100).nullable().optional(),
  startTime: timeField.optional(),
  endTime: timeField.optional(),
  slotDuration: z.number().int().min(5).max(120).optional(),
  active: z.boolean().optional(),
});

// ---------- Treatment ----------
export const createTreatmentSchema = z.object({
  name: z.string().min(1, 'Treatment name is required').max(200, 'Name too long'),
  category: z.string().max(100).nullable().optional(),
  price: z.number().min(0, 'Price must be non-negative').max(5000000, 'Price too large').optional(),
  duration: z.number().int().min(5).max(480, 'Duration must be 5-480 minutes').optional(),
  description: z.string().max(1000).nullable().optional(),
  active: z.boolean().optional(),
});

export const updateTreatmentSchema = z.object({
  id: idField,
  name: z.string().min(1, 'Treatment name is required').max(200, 'Name too long').optional(),
  category: z.string().max(100).nullable().optional(),
  price: z.number().min(0, 'Price must be non-negative').max(5000000, 'Price too large').optional(),
  duration: z.number().int().min(5).max(480, 'Duration must be 5-480 minutes').optional(),
  description: z.string().max(1000).nullable().optional(),
  active: z.boolean().optional(),
});

// ---------- Helper function ----------
export function validateBody<T>(schema: z.ZodType<T>, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false as const,
      error: firstError?.message || 'Invalid input',
    };
  }
  return { success: true as const, data: result.data };
}