"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCog,
  Plus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Pencil,
  Phone,
  Clock,
  Mail,
  Stethoscope,
  CalendarDays,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  phone: string | null;
  email: string | null;
  availableDays: string | null;
  startTime: string | null;
  endTime: string | null;
  slotDuration: number;
  active: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Helpers
// ============================================================

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function getAvailableDays(daysStr: string | null): string[] {
  if (!daysStr) return [];
  return daysStr.split(",").map((d) => d.trim()).filter(Boolean);
}

// ============================================================
// Main Component
// ============================================================

export default function DoctorManagementPage() {
  // Data state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    phone: "",
    email: "",
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as string[],
    startTime: "10:00",
    endTime: "20:00",
    slotDuration: "30",
    active: true,
  });

  // ============================================================
  // Auth helper
  // ============================================================
  // SEC-C05 FIX: Cookie-based auth — middleware validates httpOnly cookie
  const getHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
    };
  }, []);

  // ============================================================
  // Fetch doctors
  // ============================================================
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // SEC-C05 FIX: Cookie auth handled by middleware

      const res = await fetch("/api/crm/doctors?active=false", {
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }
      if (!res.ok)
        throw new Error(`Failed to load doctors (HTTP ${res.status})`);

      const json = await res.json();
      setDoctors(json.doctors ?? []);
    } catch (err) {
      console.error("Fetch doctors error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load doctors."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // ============================================================
  // Open dialog for add/edit
  // ============================================================
  const openAddDialog = () => {
    setEditMode(false);
    setEditId(null);
    setForm({
      name: "",
      specialization: "",
      phone: "",
      email: "",
      availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      startTime: "10:00",
      endTime: "20:00",
      slotDuration: "30",
      active: true,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (doctor: Doctor) => {
    setEditMode(true);
    setEditId(doctor.id);
    setForm({
      name: doctor.name,
      specialization: doctor.specialization ?? "",
      phone: doctor.phone ?? "",
      email: doctor.email ?? "",
      availableDays: getAvailableDays(doctor.availableDays),
      startTime: doctor.startTime ?? "10:00",
      endTime: doctor.endTime ?? "20:00",
      slotDuration: String(doctor.slotDuration),
      active: doctor.active === 1,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // ============================================================
  // Toggle day
  // ============================================================
  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter((d) => d !== day)
        : [...f.availableDays, day],
    }));
  };

  // ============================================================
  // Submit
  // ============================================================
  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Doctor name is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        specialization: form.specialization.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        availableDays: form.availableDays.sort().join(","),
        startTime: form.startTime,
        endTime: form.endTime,
        slotDuration: parseInt(form.slotDuration, 10) || 30,
        active: form.active,
      };

      if (editMode && editId) {
        body.id = editId;
      }

      const method = editMode ? "PUT" : "POST";
      const res = await fetch("/api/crm/doctors", {
        method,
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.error || `Failed to ${editMode ? "update" : "add"} doctor`
        );
      }

      setDialogOpen(false);
      fetchDoctors();
    } catch (err) {
      console.error("Submit doctor error:", err);
      setFormErrors({
        submit:
          err instanceof Error ? err.message : "Failed to save doctor",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <UserCog className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
            <p className="text-sm text-gray-500">
              Manage doctors and their schedules
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDoctors()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={openAddDialog}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Doctor Cards */}
      {!loading && !error && doctors.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16">
          <UserCog className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600">No Doctors</h3>
          <p className="mt-1 text-sm text-gray-400">
            Add doctors to get started.
          </p>
        </div>
      )}

      {!loading && !error && doctors.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => {
            const days = getAvailableDays(doctor.availableDays);
            return (
              <Card
                key={doctor.id}
                className={`relative transition-shadow hover:shadow-md ${
                  doctor.active !== 1 ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-5">
                  {/* Status Badge & Edit */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                          doctor.active === 1
                            ? "bg-teal-100 text-teal-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {doctor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {doctor.name}
                        </h3>
                        {doctor.specialization && (
                          <p className="text-xs text-gray-500">
                            {doctor.specialization}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doctor.active === 1 ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(doctor)}
                        title="Edit doctor"
                      >
                        <Pencil className="h-4 w-4 text-teal-600" />
                      </Button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2.5">
                    {doctor.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}
                    {doctor.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>
                        {formatTime(doctor.startTime)} —{" "}
                        {formatTime(doctor.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {days.length > 0 ? (
                          ALL_DAYS.map((day) => (
                            <span
                              key={day}
                              className={`inline-flex h-6 min-w-[28px] items-center justify-center rounded text-xs font-medium ${
                                days.includes(day)
                                  ? "bg-teal-100 text-teal-700"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {day}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No schedule set</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Stethoscope className="h-3.5 w-3.5 text-gray-400" />
                      <span>Slot: {doctor.slotDuration} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* Add/Edit Doctor Dialog */}
      {/* ============================================================ */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setFormErrors({});
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Pencil className="h-5 w-5 text-teal-600" /> Edit Doctor
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-teal-600" /> Add Doctor
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Update doctor details."
                : "Add a new doctor to the clinic."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Dr. John Smith"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              {formErrors.name && (
                <p className="text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Specialization */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Specialization</Label>
              <Input
                placeholder="e.g., Orthodontist, Endodontist"
                value={form.specialization}
                onChange={(e) =>
                  setForm((f) => ({ ...f, specialization: e.target.value }))
                }
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone</Label>
                <Input
                  placeholder="+91-XXXXXXXXXX"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="doctor@clinic.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Timings */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Slot (min)</Label>
                <Input
                  type="number"
                  min={5}
                  value={form.slotDuration}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slotDuration: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Available Days */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Available Days</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`inline-flex h-8 min-w-[40px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors ${
                      form.availableDays.includes(day)
                        ? "border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            {editMode && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={form.active ? "active" : "inactive"}
                  onValueChange={(val) =>
                    setForm((f) => ({ ...f, active: val === "active" }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...
                </>
              ) : editMode ? (
                <>
                  <Pencil className="mr-2 h-4 w-4" />Update Doctor
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />Add Doctor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
