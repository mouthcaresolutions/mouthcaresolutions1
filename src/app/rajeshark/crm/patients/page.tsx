"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Eye,
  UserPlus,
  Loader2,
  RefreshCw,
  Phone,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  phone2: string | null;
  email: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  bloodGroup: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  occupation: string | null;
  referredBy: string | null;
  medicalHistory: string | null;
  dentalHistory: string | null;
  allergies: string | null;
  currentMedications: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  insuranceProvider: string | null;
  insuranceNumber: string | null;
  category: string | null;
  notes: string | null;
  totalVisits: number;
  totalSpent: number;
  balanceDue: number;
  lastVisitDate: string | null;
  createdAt: string;
  updatedAt: string;
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getCategoryBadge(category: string | null) {
  if (!category) return <span className="text-sm text-gray-400">\u2014</span>;
  const catMap: Record<string, string> = {
    new: "bg-emerald-100 text-emerald-700 border-emerald-200",
    regular: "bg-blue-100 text-blue-700 border-blue-200",
    vip: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const cls = catMap[category.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <Badge variant="outline" className={cls}>
      {category}
    </Badge>
  );
}

function calcAgeFromDOB(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
}

// ============================================================
// Registration Form Initial State
// ============================================================

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  phone2: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  city: "Vijayawada",
  state: "AP",
  pincode: "",
  occupation: "",
  medicalHistory: "",
  dentalHistory: "",
  allergies: "",
  currentMedications: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  referredBy: "",
  insuranceProvider: "",
  insuranceNumber: "",
  category: "New",
  notes: "",
};

// ============================================================
// Main Component
// ============================================================

export default function PatientManagementPage() {
  // Data state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // Fetch Patients
  // ============================================================

  const fetchPatients = useCallback(async (search = "", category = "", page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "All") params.set("category", category);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/crm/patients?${params.toString()}`, {
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

      if (!res.ok) throw new Error(`Failed to load patients (HTTP ${res.status})`);

      const json = await res.json();
      setPatients(json.patients ?? []);
      setPagination(json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      console.error("Fetch patients error:", err);
      setError(err instanceof Error ? err.message : "Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount & when filters change
  useEffect(() => {
    fetchPatients(debouncedSearch, activeCategory, 1);
  }, [debouncedSearch, activeCategory, fetchPatients]);

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  // Page change handler
  const handlePageChange = (newPage: number) => {
    fetchPatients(debouncedSearch, activeCategory, newPage);
  };

  // ============================================================
  // Category Tabs
  // ============================================================

  const categoryTabs = [
    { label: "All", value: "All" },
    { label: "New", value: "New" },
    { label: "Regular", value: "Regular" },
    { label: "VIP", value: "VIP" },
  ];

  // ============================================================
  // Registration Form Handlers
  // ============================================================

  const openRegisterDialog = () => {
    setForm(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for field on change
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required";
    if (!form.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^\+?[\d\s-]{10,15}$/.test(form.phone.trim().replace(/\s/g, "")))
      errors.phone = "Enter a valid phone number";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setError("Authentication required.");
        return;
      }

      const age = calcAgeFromDOB(form.dateOfBirth);
      const payload = {
        ...form,
        age: age || null,
        dateOfBirth: form.dateOfBirth || null,
        lastName: form.lastName || null,
        phone2: form.phone2 || null,
        email: form.email || null,
        gender: form.gender || null,
        bloodGroup: form.bloodGroup || null,
        address: form.address || null,
        city: form.city || "Vijayawada",
        state: form.state || "AP",
        pincode: form.pincode || null,
        occupation: form.occupation || null,
        medicalHistory: form.medicalHistory || null,
        dentalHistory: form.dentalHistory || null,
        allergies: form.allergies || null,
        currentMedications: form.currentMedications || null,
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
        referredBy: form.referredBy || null,
        insuranceProvider: form.insuranceProvider || null,
        insuranceNumber: form.insuranceNumber || null,
        category: form.category || "New",
        notes: form.notes || null,
      };

      const res = await fetch("/api/crm/patients", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Registration failed (HTTP ${res.status})`);
      }

      setDialogOpen(false);
      setForm(emptyForm);
      fetchPatients(debouncedSearch, activeCategory, 1);
    } catch (err) {
      console.error("Register patient error:", err);
      setError(err instanceof Error ? err.message : "Failed to register patient.");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ========== Top Bar ========== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Register and manage all patient records
          </p>
        </div>
        <Button onClick={openRegisterDialog} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
          <UserPlus className="h-4 w-4" />
          Register New Patient
        </Button>
      </div>

      {/* ========== Error State ========== */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-800">Something went wrong</p>
              <p className="mt-0.5 text-xs text-red-600">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setError(null); fetchPatients(debouncedSearch, activeCategory, 1); }}
              className="ml-auto shrink-0 border-red-200 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========== Search Bar ========== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, phone, or patient ID..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPatients(debouncedSearch, activeCategory, 1)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ========== Category Filter Tabs ========== */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {categoryTabs.map((tab) => {
          const isActive = activeCategory === tab.value;
          const count = tab.value === "All" ? pagination.total : undefined;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {count !== undefined && (
                <span className="ml-1.5 text-xs text-gray-400">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========== Patient Table ========== */}
      <Card className="overflow-hidden shadow-sm border-0">
        <CardContent className="p-0">
          {loading && patients.length === 0 ? (
            <div className="space-y-0">
              {/* Table Header Skeleton */}
              <div className="border-b px-4 py-3">
                <div className="flex gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-16" />
                  ))}
                </div>
              </div>
              {/* Row Skeletons */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 border-b px-4 py-4 last:border-b-0">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mt-4 text-base font-medium text-gray-700">No patients found</p>
              <p className="mt-1 text-sm text-gray-400">
                {debouncedSearch || activeCategory !== "All"
                  ? "Try adjusting your search or filter criteria"
                  : "Register your first patient to get started"}
              </p>
              {!debouncedSearch && activeCategory === "All" && (
                <Button
                  onClick={openRegisterDialog}
                  className="mt-4 gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <UserPlus className="h-4 w-4" />
                  Register New Patient
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-gray-50/80">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Patient ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Phone
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Gender
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Age
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      Last Visit
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right hidden xl:table-cell">
                      Balance
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      className="group hover:bg-teal-50/50 transition-colors"
                    >
                      <TableCell>
                        <span className="font-mono text-xs text-gray-500">
                          {patient.patientId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                            {patient.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {patient.firstName}
                              {patient.lastName ? ` ${patient.lastName}` : ""}
                            </p>
                            {patient.email && (
                              <p className="truncate text-xs text-gray-400">{patient.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-gray-600">{patient.phone}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-gray-600">{patient.gender || "\u2014"}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-gray-600">{patient.age ?? "\u2014"}</span>
                      </TableCell>
                      <TableCell>{getCategoryBadge(patient.category)}</TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm text-gray-600">
                          {formatDate(patient.lastVisitDate)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-right">
                        <span
                          className={`text-sm font-medium ${
                            patient.balanceDue > 0 ? "text-red-600" : "text-gray-600"
                          }`}
                        >
                          {patient.balanceDue > 0 ? formatCurrency(patient.balanceDue) : "\u2014"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/rajeshark/crm/patient/${patient.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>

        {/* ========== Pagination ========== */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-700">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-medium text-gray-700">{pagination.total}</span> patients
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, current, and neighbors
                  return (
                    p === 1 ||
                    p === pagination.totalPages ||
                    Math.abs(p - pagination.page) <= 1
                  );
                })
                .reduce<(number | "divider")[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - arr[idx - 1] > 1) {
                    acc.push("divider");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "divider" ? (
                    <span key={`div-${idx}`} className="px-1 text-xs text-gray-400">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(item)}
                      className={`h-8 w-8 p-0 ${
                        item === pagination.page
                          ? "bg-teal-600 text-white hover:bg-teal-700"
                          : ""
                      }`}
                    >
                      {item}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========== Registration Dialog ========== */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!submitting) setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="h-5 w-5 text-teal-600" />
              Register New Patient
            </DialogTitle>
            <DialogDescription>
              Fill in the patient details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-2">
              {/* ---- Personal Information ---- */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">1</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="e.g. Ravi"
                      value={form.firstName}
                      onChange={(e) => updateForm("firstName", e.target.value)}
                      className={formErrors.firstName ? "border-red-300 focus-visible:ring-red-300" : ""}
                    />
                    {formErrors.firstName && (
                      <p className="text-xs text-red-500">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="e.g. Kumar"
                      value={form.lastName}
                      onChange={(e) => updateForm("lastName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={form.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      className={formErrors.phone ? "border-red-300 focus-visible:ring-red-300" : ""}
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-500">{formErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone2">Alternate Phone</Label>
                    <Input
                      id="phone2"
                      type="tel"
                      placeholder="e.g. 9876543211"
                      value={form.phone2}
                      onChange={(e) => updateForm("phone2", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. patient@example.com"
                      value={form.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ---- Demographics ---- */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">2</span>
                  Demographics
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Age</Label>
                    <Input
                      value={calcAgeFromDOB(form.dateOfBirth) != null ? `${calcAgeFromDOB(form.dateOfBirth)} yrs` : "\u2014 Auto-calculated"}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => updateForm("gender", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select value={form.bloodGroup} onValueChange={(v) => updateForm("bloodGroup", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                          <SelectItem key={bg} value={bg}>
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ---- Address ---- */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">3</span>
                  Address
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Street address, landmark, etc."
                      value={form.address}
                      onChange={(e) => updateForm("address", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => updateForm("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={form.state}
                      onChange={(e) => updateForm("state", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="e.g. 520001"
                      value={form.pincode}
                      onChange={(e) => updateForm("pincode", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      placeholder="e.g. Software Engineer"
                      value={form.occupation}
                      onChange={(e) => updateForm("occupation", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ---- Medical Information ---- */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">4</span>
                  Medical Information
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="medicalHistory">Medical History</Label>
                    <Textarea
                      id="medicalHistory"
                      placeholder="Diabetes, Hypertension, Heart conditions, etc."
                      value={form.medicalHistory}
                      onChange={(e) => updateForm("medicalHistory", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="dentalHistory">Dental History</Label>
                    <Textarea
                      id="dentalHistory"
                      placeholder="Previous dental procedures, ongoing treatments, etc."
                      value={form.dentalHistory}
                      onChange={(e) => updateForm("dentalHistory", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      placeholder="Drug allergies, food allergies, etc."
                      value={form.allergies}
                      onChange={(e) => updateForm("allergies", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currentMedications">Current Medications</Label>
                    <Textarea
                      id="currentMedications"
                      placeholder="List any medications the patient is currently taking"
                      value={form.currentMedications}
                      onChange={(e) => updateForm("currentMedications", e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      placeholder="Guardian / family member"
                      value={form.emergencyContactName}
                      onChange={(e) => updateForm("emergencyContactName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      placeholder="Contact number"
                      value={form.emergencyContactPhone}
                      onChange={(e) => updateForm("emergencyContactPhone", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ---- Other Details ---- */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">5</span>
                  Other Details
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="referredBy">Referred By</Label>
                    <Input
                      id="referredBy"
                      placeholder="Doctor name or source"
                      value={form.referredBy}
                      onChange={(e) => updateForm("referredBy", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Select value={form.category} onValueChange={(v) => updateForm("category", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                    <Input
                      id="insuranceProvider"
                      placeholder="Insurance company name"
                      value={form.insuranceProvider}
                      onChange={(e) => updateForm("insuranceProvider", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="insuranceNumber">Insurance Number</Label>
                    <Input
                      id="insuranceNumber"
                      placeholder="Policy / claim number"
                      value={form.insuranceNumber}
                      onChange={(e) => updateForm("insuranceNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes about this patient"
                      value={form.notes}
                      onChange={(e) => updateForm("notes", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => { if (!submitting) setDialogOpen(false); }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Register Patient
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
