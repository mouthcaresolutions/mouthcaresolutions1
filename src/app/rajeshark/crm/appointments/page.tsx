"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Plus,
  Loader2,
  RefreshCw,
  Clock,
  Filter,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  User,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ============================================================
// Types
// ============================================================

interface Appointment {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string | null;
  date: string;
  time: string;
  endTime: string | null;
  duration: number;
  status: string;
  treatmentType: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  phone: string | null;
  active: number;
}

interface Treatment {
  id: string;
  name: string;
  category: string | null;
  price: number;
  duration: number;
}

interface PatientResult {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string | null;
  phone: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================
// Helpers
// ============================================================

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

const STATUS_CYCLE: Record<string, string[]> = {
  scheduled: ["confirmed", "cancelled"],
  confirmed: ["completed", "no-show", "cancelled"],
  completed: ["scheduled"],
  cancelled: ["scheduled"],
  "no-show": ["scheduled"],
};

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    scheduled: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
    cancelled: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    "no-show": "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-600 border-gray-300";
  return (
    <Badge variant="outline" className={`${cls} cursor-pointer select-none transition-colors`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function getStatusNext(status: string): string {
  return STATUS_CYCLE[status]?.[0] ?? "scheduled";
}

// Group appointments by date
function groupByDate(appointments: Appointment[]): Record<string, Appointment[]> {
  const groups: Record<string, Appointment[]> = {};
  for (const apt of appointments) {
    if (!groups[apt.date]) groups[apt.date] = [];
    groups[apt.date].push(apt);
  }
  return groups;
}

// ============================================================
// Main Component
// ============================================================

export default function AppointmentManagementPage() {
  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [dateFilter, setDateFilter] = useState(getToday());
  const [doctorFilter, setDoctorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Patient search state
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(
    null
  );
  const patientSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [form, setForm] = useState({
    date: getToday(),
    time: "10:00",
    duration: "30",
    doctorId: "",
    treatmentType: "",
    reason: "",
    notes: "",
  });

  // ============================================================
  // Auth helper
  // ============================================================
  const getHeaders = useCallback(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("admin_token")
        : null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  // ============================================================
  // Fetch appointments
  // ============================================================
  const fetchAppointments = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("admin_token")
            : null;
        if (!token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (dateFilter) params.set("date", dateFilter);
        if (doctorFilter) params.set("doctorId", doctorFilter);
        if (statusFilter) params.set("status", statusFilter);
        params.set("page", String(page));
        params.set("limit", "50");

        const res = await fetch(`/api/crm/appointments?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 401) {
          setError("Session expired. Please log in again.");
          setLoading(false);
          return;
        }
        if (!res.ok)
          throw new Error(
            `Failed to load appointments (HTTP ${res.status})`
          );

        const json = await res.json();
        setAppointments(json.appointments ?? []);
        setPagination(
          json.pagination ?? {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        console.error("Fetch appointments error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load appointments."
        );
      } finally {
        setLoading(false);
      }
    },
    [dateFilter, doctorFilter, statusFilter]
  );

  // ============================================================
  // Fetch doctors & treatments
  // ============================================================
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/doctors", {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setDoctors(json.doctors ?? []);
      }
    } catch (err) {
      console.error("Fetch doctors error:", err);
    }
  }, [getHeaders]);

  const fetchTreatments = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/treatments", {
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setTreatments(json.treatments ?? []);
      }
    } catch (err) {
      console.error("Fetch treatments error:", err);
    }
  }, [getHeaders]);

  // ============================================================
  // Effects
  // ============================================================
  useEffect(() => {
    fetchDoctors();
    fetchTreatments();
  }, [fetchDoctors, fetchTreatments]);

  useEffect(() => {
    fetchAppointments(1);
  }, [fetchAppointments]);

  // Close patient dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPatientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ============================================================
  // Patient search
  // ============================================================
  const handlePatientSearch = (value: string) => {
    setPatientSearch(value);
    setSelectedPatient(null);
    if (patientSearchRef.current) clearTimeout(patientSearchRef.current);

    if (value.length < 3) {
      setPatientResults([]);
      setShowPatientDropdown(false);
      return;
    }

    setPatientSearching(true);
    patientSearchRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/crm/patients?search=${encodeURIComponent(value)}&limit=10`, {
          headers: getHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          setPatientResults(json.patients ?? []);
          setShowPatientDropdown(true);
        }
      } catch (err) {
        console.error("Patient search error:", err);
      } finally {
        setPatientSearching(false);
      }
    }, 350);
  };

  const selectPatient = (patient: PatientResult) => {
    setSelectedPatient(patient);
    setPatientSearch(
      `${patient.firstName}${patient.lastName ? " " + patient.lastName : ""} (${patient.patientId})`
    );
    setShowPatientDropdown(false);
  };

  // ============================================================
  // Status update
  // ============================================================
  const handleStatusClick = async (appointment: Appointment) => {
    const nextStatus = getStatusNext(appointment.status);
    try {
      const res = await fetch("/api/crm/appointments", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ id: appointment.id, status: nextStatus }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointment.id ? { ...a, status: nextStatus } : a
          )
        );
      }
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  // ============================================================
  // Form submit
  // ============================================================
  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!selectedPatient) errors.patient = "Please select a patient";
    if (!form.date) errors.date = "Date is required";
    if (!form.time) errors.time = "Time is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/crm/appointments", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          patientId: selectedPatient!.id,
          date: form.date,
          time: form.time,
          duration: parseInt(form.duration, 10),
          doctorId: form.doctorId || null,
          treatmentType: form.treatmentType || null,
          reason: form.reason || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to book appointment`);
      }
      // Success
      setDialogOpen(false);
      resetForm();
      fetchAppointments(1);
    } catch (err) {
      console.error("Book appointment error:", err);
      setFormErrors({
        submit: err instanceof Error ? err.message : "Failed to book appointment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      date: getToday(),
      time: "10:00",
      duration: "30",
      doctorId: "",
      treatmentType: "",
      reason: "",
      notes: "",
    });
    setPatientSearch("");
    setSelectedPatient(null);
    setPatientResults([]);
    setFormErrors({});
  };

  // ============================================================
  // Filter change handlers
  // ============================================================
  const handleDateChange = (value: string) => {
    setDateFilter(value);
  };

  const handleDoctorFilterChange = (value: string) => {
    setDoctorFilter(value === "all" ? "" : value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
  };

  // ============================================================
  // Render
  // ============================================================
  const grouped = groupByDate(appointments);
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <Calendar className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Appointment Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage and track patient appointments
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                Date
              </Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => handleDateChange(e.target.value)}
                className="max-w-[180px]"
              />
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                Doctor
              </Label>
              <Select value={doctorFilter || "all"} onValueChange={handleDoctorFilterChange}>
                <SelectTrigger className="w-full sm:max-w-[200px]">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs font-medium text-gray-500">
                Status
              </Label>
              <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:max-w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchAppointments(1)}
              className="shrink-0"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-14 w-full" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Appointments Table - Grouped by Date */}
      {!loading && !error && dateKeys.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16">
          <Calendar className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600">No Appointments</h3>
          <p className="mt-1 text-sm text-gray-400">
            No appointments found for the selected filters.
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        dateKeys.map((date) => (
          <div key={date} className="space-y-2">
            {/* Date Header */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <div className="flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-sm font-semibold text-teal-700">
                  {formatDate(date)}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-teal-100 text-teal-600"
                >
                  {grouped[date].length}
                </Badge>
              </div>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Appointments for this date */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="w-[100px]">Time</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead className="hidden md:table-cell">Doctor</TableHead>
                        <TableHead className="hidden lg:table-cell">Treatment</TableHead>
                        <TableHead className="w-[130px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grouped[date]
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((apt) => (
                          <TableRow
                            key={apt.id}
                            className="transition-colors hover:bg-gray-50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {formatTime(apt.time)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {apt.duration} min
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                                  {apt.patientName?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {apt.patientName}
                                  </p>
                                  {apt.reason && (
                                    <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                      {apt.reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-1.5">
                                <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-gray-700">
                                  {apt.doctorName || "Not assigned"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-gray-600">
                                {apt.treatmentType || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleStatusClick(apt)}
                                title={`Click to change status (next: ${getStatusNext(apt.status)})`}
                              >
                                {getStatusBadge(apt.status)}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchAppointments(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchAppointments(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* New Appointment Dialog */}
      {/* ============================================================ */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              New Appointment
            </DialogTitle>
            <DialogDescription>
              Book a new appointment for a patient.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Patient Search */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Patient <span className="text-red-500">*</span>
              </Label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Type 3+ characters to search patients..."
                    value={patientSearch}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    className="pl-9"
                  />
                  {patientSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                  )}
                  {selectedPatient && (
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearch("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {/* Patient Dropdown */}
                {showPatientDropdown && patientResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-teal-50"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                          {p.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {p.firstName}{p.lastName ? ` ${p.lastName}` : ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {p.patientId} • {p.phone}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showPatientDropdown && patientSearch.length >= 3 && !patientSearching && patientResults.length === 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg">
                    No patients found
                  </div>
                )}
              </div>
              {formErrors.patient && (
                <p className="text-xs text-red-500">{formErrors.patient}</p>
              )}
            </div>

            {/* Doctor */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Doctor</Label>
              <Select
                value={form.doctorId}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, doctorId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                      {d.specialization ? ` (${d.specialization})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
                {formErrors.date && (
                  <p className="text-xs text-red-500">{formErrors.date}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                />
                {formErrors.time && (
                  <p className="text-xs text-red-500">{formErrors.time}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Duration</Label>
              <Select
                value={form.duration}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, duration: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Treatment Type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Treatment Type</Label>
              <Select
                value={form.treatmentType}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, treatmentType: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment" />
                </SelectTrigger>
                <SelectContent>
                  {treatments.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Reason</Label>
              <Textarea
                placeholder="Reason for visit..."
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Submit Error */}
            {formErrors.submit && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{formErrors.submit}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Book Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
