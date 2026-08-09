'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Activity,
  CreditCard,
  User,
  MapPin,
  Heart,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  IndianRupee,
  Stethoscope,
  ShieldCheck,
  Building2,
  Hash,
  UserPlus,
  CalendarPlus,
  Wallet,
  EyeOff,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  phone2: string;
  email: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  bloodGroup: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  occupation: string;
  referredBy: string;
  medicalHistory: string;
  dentalHistory: string;
  allergies: string;
  currentMedications: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
  insuranceNumber: string;
  category: string;
  notes: string;
  totalVisits: number;
  totalSpent: number;
  balanceDue: number;
  lastVisitDate: string;
  createdAt: string;
}

interface Visit {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId: string;
  date: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentDone: string;
  prescription: string;
  notes: string;
  followUpDate: string;
  totalAmount: number;
  discount: number;
  createdAt: string;
}

interface Appointment {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  status: string;
  treatmentType: string;
  reason: string;
  notes: string;
  createdAt: string;
}

interface Payment {
  id: string;
  paymentId: string;
  patientId: string;
  patientName: string;
  visitId: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: string;
  status: string;
  date: string;
  dueDate: string;
  items: string;
  notes: string;
  createdAt: string;
}

interface PatientData {
  patient: Patient;
  visits: Visit[];
  appointments: Appointment[];
  payments: Payment[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const inrFormat = (amount: number) =>
  `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr: string, timeStr?: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  if (timeStr) {
    return `${formattedDate}, ${timeStr}`;
  }
  return formattedDate;
};

const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase();
  const map: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    confirmed: 'bg-green-100 text-green-800 hover:bg-green-100',
    completed: 'bg-teal-100 text-teal-800 hover:bg-teal-100',
    cancelled: 'bg-red-100 text-red-800 hover:bg-red-100',
    'no-show': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    paid: 'bg-green-100 text-green-800 hover:bg-green-100',
    partial: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    pending: 'bg-red-100 text-red-800 hover:bg-red-100',
  };
  return map[s] || 'bg-gray-100 text-gray-800 hover:bg-gray-100';
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function PatientProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = use(props.params);
  const id = params.id;

  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) throw new Error('Authentication required. Please log in.');

      const res = await fetch(`/api/crm/patient/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Failed to fetch patient (HTTP ${res.status})`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  // ── Loading Skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Back button skeleton */}
          <Skeleton className="mb-6 h-9 w-36" />

          {/* Header skeleton */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>

          {/* Tabs skeleton */}
          <Skeleton className="mb-6 h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/rajeshark/crm/patients">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Button>
          </Link>
          <Card className="mx-auto max-w-lg border-red-200 bg-red-50/50">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900">Failed to Load Patient</h2>
                <p className="mt-1 text-sm text-red-700">{error || 'No data received from the server.'}</p>
              </div>
              <Button onClick={fetchPatient} variant="outline" className="gap-2 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { patient, visits, appointments, payments } = data;
  const fullName = `${patient.firstName} ${patient.lastName}`;

  // ── Overview Info Items ───────────────────────────────────────────────────

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value || '—'}</p>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Back Button ──────────────────────────────────────────────────── */}
        <Link href="/rajeshark/crm/patients">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Button>
        </Link>

        {/* ── Profile Header ───────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {fullName}
              </h1>
              <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-200">
                <Hash className="mr-1 h-3 w-3" />
                {patient.patientId}
              </Badge>
              {patient.category && (
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                  {patient.category}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {patient.phone}
              </span>
              {patient.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {patient.email}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Registered {formatDate(patient.createdAt)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button className="bg-teal-600 text-white hover:bg-teal-700 shadow-sm">
              <CalendarPlus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Activity className="mr-2 h-4 w-4" />
              New Visit
            </Button>
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              <Wallet className="mr-2 h-4 w-4" />
              New Payment
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ──────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                <Activity className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Visits</p>
                <p className="text-xl font-bold text-gray-900">{patient.totalVisits ?? visits.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold text-gray-900">{inrFormat(patient.totalSpent ?? 0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${patient.balanceDue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <CreditCard className={`h-5 w-5 ${patient.balanceDue > 0 ? 'text-red-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Balance Due</p>
                <p className={`text-xl font-bold ${patient.balanceDue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {inrFormat(patient.balanceDue ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Last Visit</p>
                <p className="text-sm font-bold text-gray-900">
                  {patient.lastVisitDate ? formatDate(patient.lastVisitDate) : 'No visits yet'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border shadow-sm rounded-lg h-11 p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-md text-sm font-medium px-4"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="visits"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-md text-sm font-medium px-4"
            >
              Visits
              {visits.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-100 px-1.5 text-[10px] font-semibold text-teal-700 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {visits.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="appointments"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-md text-sm font-medium px-4"
            >
              Appointments
              {appointments.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-100 px-1.5 text-[10px] font-semibold text-teal-700 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {appointments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-md text-sm font-medium px-4"
            >
              Payments
              {payments.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-100 px-1.5 text-[10px] font-semibold text-teal-700 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                  {payments.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ──────────────────────────────────────────────── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* Personal Information */}
              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <User className="h-4 w-4 text-teal-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <InfoItem icon={User} label="Full Name" value={fullName} />
                  <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
                  <InfoItem icon={User} label="Age" value={patient.age ? `${patient.age} years` : ''} />
                  <InfoItem icon={User} label="Gender" value={patient.gender} />
                  <InfoItem icon={Heart} label="Blood Group" value={patient.bloodGroup} />
                  <InfoItem icon={Building2} label="Occupation" value={patient.occupation} />
                  <InfoItem icon={UserPlus} label="Referred By" value={patient.referredBy} />
                </CardContent>
              </Card>

              {/* Contact & Address */}
              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    Contact & Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <InfoItem icon={Phone} label="Primary Phone" value={patient.phone} />
                  <InfoItem icon={Phone} label="Secondary Phone" value={patient.phone2} />
                  <InfoItem icon={Mail} label="Email" value={patient.email} />
                  <InfoItem icon={MapPin} label="Address" value={patient.address} />
                  <InfoItem icon={MapPin} label="City" value={patient.city} />
                  <InfoItem icon={MapPin} label="State" value={patient.state} />
                  <InfoItem icon={MapPin} label="Pincode" value={patient.pincode} />
                </CardContent>
              </Card>

              {/* Medical History */}
              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Heart className="h-4 w-4 text-teal-600" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-start gap-3 py-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">Medical History</p>
                      <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words">
                        {patient.medicalHistory || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">Dental History</p>
                      <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words">
                        {patient.dentalHistory || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">Allergies</p>
                      <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words">
                        {patient.allergies || 'None reported'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">Current Medications</p>
                      <p className="text-sm font-medium text-foreground whitespace-pre-wrap break-words">
                        {patient.currentMedications || 'None'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Phone className="h-4 w-4 text-teal-600" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <InfoItem icon={User} label="Contact Name" value={patient.emergencyContactName} />
                  <InfoItem icon={Phone} label="Contact Phone" value={patient.emergencyContactPhone} />
                </CardContent>
              </Card>

              {/* Insurance */}
              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <InfoItem icon={ShieldCheck} label="Provider" value={patient.insuranceProvider} />
                  <InfoItem icon={Hash} label="Insurance Number" value={patient.insuranceNumber} />
                </CardContent>
              </Card>

              {/* Notes */}
              {patient.notes && (
                <Card className="border-0 bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                      <FileText className="h-4 w-4 text-teal-600" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                      {patient.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Visits Tab ────────────────────────────────────────────────── */}
          <TabsContent value="visits">
            <Card className="border-0 bg-white shadow-sm overflow-hidden">
              {visits.length === 0 ? (
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                    <EyeOff className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No visits recorded yet</p>
                  <p className="mt-1 text-xs text-gray-400">Visits will appear here after they are created.</p>
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Doctor</TableHead>
                        <TableHead className="font-semibold">Complaint</TableHead>
                        <TableHead className="font-semibold">Diagnosis</TableHead>
                        <TableHead className="font-semibold text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visits.map((visit) => (
                        <Collapsible
                          key={visit.id}
                          open={expandedVisit === visit.id}
                          onOpenChange={(open) => setExpandedVisit(open ? visit.id : null)}
                        >
                          <CollapsibleTrigger asChild>
                            <TableRow className="cursor-pointer hover:bg-teal-50/50 transition-colors group">
                              <TableCell className="w-8">
                                {expandedVisit === visit.id ? (
                                  <ChevronUp className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium whitespace-nowrap">
                                {formatDate(visit.date)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{visit.doctorName || '—'}</TableCell>
                              <TableCell className="max-w-[200px] truncate" title={visit.chiefComplaint}>
                                {visit.chiefComplaint || '—'}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate" title={visit.diagnosis}>
                                {visit.diagnosis || '—'}
                              </TableCell>
                              <TableCell className="text-right font-semibold whitespace-nowrap">
                                {visit.totalAmount ? inrFormat(visit.totalAmount) : '—'}
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <>
                              <TableRow className="bg-teal-50/30 hover:bg-teal-50/30">
                                <TableCell colSpan={6} className="py-3">
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                      <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">Treatment Done</p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                        {visit.treatmentDone || '—'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">Prescription</p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                        {visit.prescription || '—'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">Follow-Up</p>
                                      <p className="text-sm text-gray-700">
                                        {visit.followUpDate ? formatDate(visit.followUpDate) : 'None'}
                                      </p>
                                      {visit.discount > 0 && (
                                        <p className="mt-2 text-xs text-emerald-600 font-medium">
                                          Discount: {inrFormat(visit.discount)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {visit.notes && (
                                    <div className="mt-3 rounded-lg border border-teal-100 bg-white p-3">
                                      <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">Notes</p>
                                      <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                                        {visit.notes}
                                      </p>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow className="border-b-0">
                                <TableCell colSpan={6} className="h-1 p-0" />
                              </TableRow>
                            </>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── Appointments Tab ──────────────────────────────────────────── */}
          <TabsContent value="appointments">
            <Card className="border-0 bg-white shadow-sm overflow-hidden">
              {appointments.length === 0 ? (
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No appointments scheduled</p>
                  <p className="mt-1 text-xs text-gray-400">Appointments will appear here after they are created.</p>
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Time</TableHead>
                        <TableHead className="font-semibold">Doctor</TableHead>
                        <TableHead className="font-semibold">Treatment</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appt) => (
                        <TableRow key={appt.id} className="hover:bg-teal-50/50 transition-colors">
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatDate(appt.date)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              {appt.time}
                              {appt.endTime && (
                                <span className="text-gray-400">– {appt.endTime}</span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{appt.doctorName || '—'}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={appt.treatmentType || appt.reason}>
                            {appt.treatmentType || appt.reason || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(appt.status)}>
                              {appt.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── Payments Tab ──────────────────────────────────────────────── */}
          <TabsContent value="payments">
            <Card className="border-0 bg-white shadow-sm overflow-hidden">
              {payments.length === 0 ? (
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                    <CreditCard className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No payments recorded</p>
                  <p className="mt-1 text-xs text-gray-400">Payments will appear here after they are created.</p>
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead className="font-semibold">Invoice #</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold text-right">Amount</TableHead>
                        <TableHead className="font-semibold text-right">Paid</TableHead>
                        <TableHead className="font-semibold text-right">Balance</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-teal-50/50 transition-colors">
                          <TableCell className="font-medium whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-gray-400" />
                              {payment.invoiceNumber || payment.paymentId}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(payment.date)}</TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">
                            {inrFormat(payment.amount)}
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap text-emerald-600">
                            {inrFormat(payment.paidAmount)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold whitespace-nowrap ${payment.balanceAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {inrFormat(payment.balanceAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
