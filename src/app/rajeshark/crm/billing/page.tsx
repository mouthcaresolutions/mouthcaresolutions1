"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Receipt,
  Plus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Search,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  X,
  Printer,
  TrendingUp,
  Clock,
  CheckCircle2,
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

interface Payment {
  id: string;
  paymentId: string;
  patientId: string;
  patientName: string;
  visitId: string | null;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: string | null;
  status: string;
  date: string;
  dueDate: string | null;
  items: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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

interface LineItem {
  treatmentId: string;
  name: string;
  price: number;
  qty: number;
  amount: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SummaryCards {
  totalRevenue: number;
  pendingAmount: number;
  thisMonth: number;
}

// ============================================================
// Helpers
// ============================================================

function inr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    partial: "bg-amber-100 text-amber-700 border-amber-200",
    pending: "bg-red-100 text-red-700 border-red-200",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-600 border-gray-300";
  return (
    <Badge variant="outline" className={cls}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function parseItems(itemsStr: string | null): LineItem[] {
  if (!itemsStr) return [];
  try {
    return JSON.parse(itemsStr);
  } catch {
    return [];
  }
}

// ============================================================
// Main Component
// ============================================================

export default function BillingPage() {
  // Data state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [summary, setSummary] = useState<SummaryCards>({
    totalRevenue: 0,
    pendingAmount: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [patientSearchFilter, setPatientSearchFilter] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New Invoice dialog state
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Patient search in form
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const patientSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { treatmentId: "", name: "", price: 0, qty: 1, amount: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  // Record Payment dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);
  const [recordAmount, setRecordAmount] = useState(0);
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  // View Invoice dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);

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
  // Calculated values
  // ============================================================
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    setPaidAmount(total);
  }, [total]);

  // ============================================================
  // Fetch payments
  // ============================================================
  const fetchPayments = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        // SEC-C05 FIX: Cookie auth handled by middleware

        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        params.set("page", String(page));
        params.set("limit", "50");

        const res = await fetch(`/api/crm/payments?${params.toString()}`, {
          credentials: 'include', headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401) {
          setError("Session expired. Please log in again.");
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(`Failed to load payments (HTTP ${res.status})`);

        const json = await res.json();
        const paymentsList = json.payments ?? [];
        setPayments(paymentsList);
        setPagination(json.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 });

        // Calculate summary
        const totalRev = paymentsList.reduce((s, p) => s + p.paidAmount, 0);
        const pendingAmt = paymentsList.reduce(
          (s, p) => s + (p.status === "pending" || p.status === "partial" ? p.balanceAmount : 0),
          0
        );
        const monthStart = getMonthStart();
        const thisMonthAmt = paymentsList
          .filter((p) => p.date >= monthStart)
          .reduce((s, p) => s + p.paidAmount, 0);
        setSummary({ totalRevenue: totalRev, pendingAmount: pendingAmt, thisMonth: thisMonthAmt });
      } catch (err) {
        console.error("Fetch payments error:", err);
        setError(err instanceof Error ? err.message : "Failed to load payments.");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, dateFrom, dateTo]
  );

  // ============================================================
  // Fetch treatments
  // ============================================================
  const fetchTreatments = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/treatments", { credentials: "include", headers: getHeaders() });
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
    fetchTreatments();
  }, [fetchTreatments]);

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

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
  // Patient search in form
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
          credentials: "include", headers: getHeaders(),
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
    setPatientSearch(`${patient.firstName}${patient.lastName ? " " + patient.lastName : ""} (${patient.patientId})`);
    setShowPatientDropdown(false);
  };

  // ============================================================
  // Line item management
  // ============================================================
  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === "treatmentId") {
        item.treatmentId = value as string;
        const treatment = treatments.find((t) => t.id === value);
        if (treatment) {
          item.name = treatment.name;
          item.price = treatment.price;
          item.amount = treatment.price * item.qty;
        }
      } else if (field === "qty") {
        item.qty = Math.max(1, parseInt(String(value), 10) || 1);
        item.amount = item.price * item.qty;
      } else if (field === "amount") {
        item.amount = parseFloat(String(value)) || 0;
      }
      updated[index] = item;
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, { treatmentId: "", name: "", price: 0, qty: 1, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // ============================================================
  // Submit Invoice
  // ============================================================
  const handleSubmitInvoice = async () => {
    const errors: Record<string, string> = {};
    if (!selectedPatient) errors.patient = "Please select a patient";
    if (lineItems.every((i) => !i.treatmentId)) errors.items = "Add at least one treatment";
    if (total <= 0) errors.total = "Total must be greater than 0";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const validItems = lineItems.filter((i) => i.treatmentId);
      const res = await fetch("/api/crm/payments", {
        method: "POST",
        credentials: "include", headers: getHeaders(),
        body: JSON.stringify({
          patientId: selectedPatient!.id,
          date: getToday(),
          amount: total,
          paidAmount: Math.min(paidAmount, total),
          paymentMethod: paymentMethod || null,
          dueDate: dueDate || null,
          items: JSON.stringify(validItems),
          notes: invoiceNotes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create invoice");
      }
      setInvoiceDialogOpen(false);
      resetInvoiceForm();
      fetchPayments(1);
    } catch (err) {
      console.error("Create invoice error:", err);
      setFormErrors({ submit: err instanceof Error ? err.message : "Failed to create invoice" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetInvoiceForm = () => {
    setPatientSearch("");
    setSelectedPatient(null);
    setPatientResults([]);
    setLineItems([{ treatmentId: "", name: "", price: 0, qty: 1, amount: 0 }]);
    setDiscount(0);
    setPaymentMethod("Cash");
    setPaidAmount(0);
    setDueDate("");
    setInvoiceNotes("");
    setFormErrors({});
  };

  // ============================================================
  // Record Payment
  // ============================================================
  const openRecordPayment = (payment: Payment) => {
    setPayingPayment(payment);
    setRecordAmount(payment.balanceAmount);
    setPayDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!payingPayment || recordAmount <= 0) return;
    setRecordSubmitting(true);
    try {
      const res = await fetch("/api/crm/payments", {
        method: "PUT",
        credentials: "include", headers: getHeaders(),
        body: JSON.stringify({
          id: payingPayment.id,
          addPayment: recordAmount,
        }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      setPayDialogOpen(false);
      fetchPayments(pagination.page);
    } catch (err) {
      console.error("Record payment error:", err);
    } finally {
      setRecordSubmitting(false);
    }
  };

  // ============================================================
  // View Invoice
  // ============================================================
  const openViewInvoice = (payment: Payment) => {
    setViewingPayment(payment);
    setViewDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // ============================================================
  // Filter change handlers
  // ============================================================
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <Receipt className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
            <p className="text-sm text-gray-500">Manage invoices and payment tracking</p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetInvoiceForm();
            setInvoiceDialogOpen(true);
          }}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600">Total Revenue</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{inr(summary.totalRevenue)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600">Pending Amount</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{inr(summary.pendingAmount)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-600">This Month</p>
                <p className="mt-1 text-2xl font-bold text-teal-700">{inr(summary.thisMonth)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs font-medium text-gray-500">Status</Label>
              <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:max-w-[160px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs font-medium text-gray-500">From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:max-w-[170px]" />
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs font-medium text-gray-500">To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:max-w-[170px]" />
            </div>
            <Button variant="outline" size="icon" onClick={() => fetchPayments(1)} className="shrink-0" title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {/* Payments Table */}
      {!loading && !error && payments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16">
          <Receipt className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600">No Invoices</h3>
          <p className="mt-1 text-sm text-gray-400">No invoices found for the selected filters.</p>
        </div>
      )}

      {!loading && !error && payments.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-[140px]">Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Paid</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Balance</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className="transition-colors hover:bg-gray-50">
                      <TableCell className="font-mono text-sm font-medium text-teal-700">{p.invoiceNumber}</TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900">{p.patientName}</p>
                        {p.paymentMethod && (
                          <p className="text-xs text-gray-400">{p.paymentMethod}</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-gray-600">{formatDate(p.date)}</TableCell>
                      <TableCell className="text-right font-medium text-gray-900">{inr(p.amount)}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-emerald-600">{inr(p.paidAmount)}</TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        <span className={p.balanceAmount > 0 ? "text-red-600 font-medium" : "text-gray-400"}>
                          {inr(p.balanceAmount)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View Invoice" onClick={() => openViewInvoice(p)}>
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          {(p.status === "pending" || p.status === "partial") && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Record Payment" onClick={() => openRecordPayment(p)}>
                              <CreditCard className="h-4 w-4 text-teal-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchPayments(pagination.page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchPayments(pagination.page + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* New Invoice Dialog */}
      {/* ============================================================ */}
      <Dialog open={invoiceDialogOpen} onOpenChange={(open) => { setInvoiceDialogOpen(open); if (!open) resetInvoiceForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-teal-600" />
              New Invoice
            </DialogTitle>
            <DialogDescription>Create a new invoice for a patient.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Patient Search */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Patient <span className="text-red-500">*</span></Label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Type 3+ characters to search patients..." value={patientSearch} onChange={(e) => handlePatientSearch(e.target.value)} className="pl-9" />
                  {patientSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />}
                  {selectedPatient && (
                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {showPatientDropdown && patientResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                    {patientResults.map((p) => (
                      <button key={p.id} onClick={() => selectPatient(p)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-teal-50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">{p.firstName.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.firstName}{p.lastName ? ` ${p.lastName}` : ""}</p>
                          <p className="text-xs text-gray-500">{p.patientId} • {p.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {formErrors.patient && <p className="text-xs text-red-500">{formErrors.patient}</p>}
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Line Items <span className="text-red-500">*</span></Label>
                <Button variant="ghost" size="sm" onClick={addLineItem} className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 rounded-lg border border-gray-200 p-3">
                    <div className="flex-1 space-y-2">
                      <Select
                        value={item.treatmentId}
                        onValueChange={(val) => updateLineItem(idx, "treatmentId", val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select treatment" />
                        </SelectTrigger>
                        <SelectContent>
                          {treatments.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name} — {inr(t.price)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-gray-500">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => updateLineItem(idx, "qty", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500">Amount</Label>
                          <Input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateLineItem(idx, "amount", e.target.value)}
                            readOnly={!item.treatmentId}
                          />
                        </div>
                      </div>
                    </div>
                    {lineItems.length > 1 && (
                      <Button variant="ghost" size="icon" className="mt-6 h-8 w-8 shrink-0 text-red-400 hover:text-red-600" onClick={() => removeLineItem(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {formErrors.items && <p className="text-xs text-red-500">{formErrors.items}</p>}
            </div>

            {/* Totals */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{inr(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Label className="text-gray-600">Discount (₹)</Label>
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-32 text-right" />
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-teal-700">{inr(total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Paid Amount (₹)</Label>
                  <Input type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea placeholder="Invoice notes..." value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} rows={2} />
              </div>
            </div>

            {formErrors.submit && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{formErrors.submit}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmitInvoice} disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Create Invoice</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Record Payment Dialog */}
      {/* ============================================================ */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal-600" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              {payingPayment && (
                <>
                  Invoice: <span className="font-mono font-medium text-teal-700">{payingPayment.invoiceNumber}</span> — {payingPayment.patientName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {payingPayment && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-medium">{inr(payingPayment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Already Paid</span>
                  <span className="font-medium text-emerald-600">{inr(payingPayment.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Balance Due</span>
                  <span className="font-medium text-red-600">{inr(payingPayment.balanceAmount)}</span>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Payment Amount (₹) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                max={payingPayment?.balanceAmount ?? 0}
                value={recordAmount}
                onChange={(e) => setRecordAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)} disabled={recordSubmitting}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={recordSubmitting || recordAmount <= 0} className="bg-teal-600 hover:bg-teal-700 text-white">
              {recordSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><CreditCard className="mr-2 h-4 w-4" />Record Payment</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* View Invoice Dialog (Printable) */}
      {/* ============================================================ */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl print:m-0 print:p-0 print:max-w-none print:shadow-none print:border-0">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-600" />
              Invoice Details
            </DialogTitle>
          </DialogHeader>

          {viewingPayment && (
            <div className="print:p-8" id="invoice-printable">
              {/* Clinic Header */}
              <div className="text-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-teal-800">MCS Dental Clinic</h2>
                <p className="text-sm text-gray-500 mt-1">Vijayawada, Andhra Pradesh</p>
                <p className="text-xs text-gray-400">Phone: +91-XXXXXXXXXX</p>
              </div>

              {/* Invoice Meta */}
              <div className="flex justify-between mb-6">
                <div>
                  <p className="text-xs text-gray-500">Invoice Number</p>
                  <p className="font-mono font-semibold text-teal-700">{viewingPayment.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(viewingPayment.date)}</p>
                  {viewingPayment.dueDate && (
                    <>
                      <p className="text-xs text-gray-500 mt-1">Due Date</p>
                      <p className="font-medium">{formatDate(viewingPayment.dueDate)}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Patient Info */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6">
                <p className="text-xs font-medium text-gray-500 mb-1">Patient</p>
                <p className="text-lg font-semibold text-gray-900">{viewingPayment.patientName}</p>
              </div>

              {/* Line Items Table */}
              <div className="mb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="text-gray-700">#</TableHead>
                      <TableHead className="text-gray-700">Treatment</TableHead>
                      <TableHead className="text-right text-gray-700">Price</TableHead>
                      <TableHead className="text-right text-gray-700">Qty</TableHead>
                      <TableHead className="text-right text-gray-700">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseItems(viewingPayment.items).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{inr(item.price)}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right font-medium">{inr(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {parseItems(viewingPayment.items).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-400 py-4">No itemized treatments</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold">{inr(viewingPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid</span>
                    <span className="font-semibold text-emerald-600">{inr(viewingPayment.paidAmount)}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Balance</span>
                    <span className={`font-bold ${viewingPayment.balanceAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {inr(viewingPayment.balanceAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="font-medium">{viewingPayment.paymentMethod || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    {getStatusBadge(viewingPayment.status)}
                  </div>
                </div>
                {viewingPayment.notes && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm text-gray-700">{viewingPayment.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
                <p>Thank you for choosing MCS Dental Clinic!</p>
              </div>
            </div>
          )}

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
