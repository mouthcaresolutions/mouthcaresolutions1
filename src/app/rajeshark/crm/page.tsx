"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Calendar,
  IndianRupee,
  AlertCircle,
  UserPlus,
  Loader2,
  RefreshCw,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// --- Types ---

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  todayRevenue: number;
  pendingPayments: number;
  newPatientsThisMonth: number;
  appointmentStatusBreakdown: Record<string, number>;
  revenueLast7Days: { date: string; revenue: number }[];
  recentPatients: RecentPatient[];
  todayAppointmentsList: TodayAppointment[];
}

interface RecentPatient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  category: string | null;
  totalVisits: number;
  totalSpent: number;
  lastVisitDate: string | null;
  createdAt: string;
}

interface TodayAppointment {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string | null;
  time: string;
  status: string;
  treatmentType: string | null;
  reason: string | null;
}

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
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

function formatTime(timeStr: string): string {
  if (!timeStr) return "—";
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  } catch {
    return timeStr;
  }
}

function getStatusBadge(status: string) {
  const s = status?.toLowerCase() ?? "unknown";
  const config: Record<string, { className: string; label: string }> = {
    scheduled: {
      className: "bg-blue-100 text-blue-700 border-blue-200",
      label: "Scheduled",
    },
    confirmed: {
      className: "bg-green-100 text-green-700 border-green-200",
      label: "Confirmed",
    },
    completed: {
      className: "bg-teal-100 text-teal-700 border-teal-200",
      label: "Completed",
    },
    cancelled: {
      className: "bg-red-100 text-red-700 border-red-200",
      label: "Cancelled",
    },
    "no-show": {
      className: "bg-orange-100 text-orange-700 border-orange-200",
      label: "No Show",
    },
  };

  const entry = config[s] ?? {
    className: "bg-gray-100 text-gray-700 border-gray-200",
    label: status,
  };

  return (
    <Badge variant="outline" className={entry.className}>
      {entry.label}
    </Badge>
  );
}

function getCategoryBadge(category: string | null) {
  if (!category) return <span className="text-sm text-gray-400">—</span>;
  const catMap: Record<string, { className: string }> = {
    new: { className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    regular: {
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    vip: { className: "bg-amber-100 text-amber-700 border-amber-200" },
    premium: {
      className: "bg-purple-100 text-purple-700 border-purple-200",
    },
  };
  const config = catMap[category.toLowerCase()] ?? {
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <Badge variant="outline" className={config.className}>
      {category}
    </Badge>
  );
}

// --- Stat Card Component ---

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  loading?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subtitle,
  loading,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500 truncate">
              {title}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-gray-900 tracking-tight">
                {value}
              </p>
            )}
            {subtitle && !loading && (
              <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Skeleton Loaders ---

function StatCardsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-2 h-8 w-20" />
              </div>
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// --- Main Dashboard Page ---

export default function CRMDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
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

      const res = await fetch("/api/crm/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load dashboard (HTTP ${res.status})`);
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            CRM Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your dental clinic operations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboard}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-red-800">
                Unable to load dashboard
              </p>
              <p className="mt-0.5 text-xs text-red-600">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboard}
              className="ml-auto shrink-0 border-red-200 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {loading && !data ? (
          <StatCardsSkeleton />
        ) : (
          <>
            <StatCard
              title="Total Patients"
              value={data?.totalPatients ?? 0}
              icon={Users}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              loading={loading}
            />
            <StatCard
              title="Today's Appointments"
              value={data?.todayAppointments ?? 0}
              icon={Calendar}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              loading={loading}
            />
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(data?.todayRevenue ?? 0)}
              icon={IndianRupee}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              loading={loading}
            />
            <StatCard
              title="Pending Payments"
              value={formatCurrency(data?.pendingPayments ?? 0)}
              icon={AlertCircle}
              iconBg="bg-red-50"
              iconColor="text-red-600"
              loading={loading}
            />
            <StatCard
              title="New This Month"
              value={data?.newPatientsThisMonth ?? 0}
              icon={UserPlus}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
              loading={loading}
            />
          </>
        )}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Appointments */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Clock className="h-4 w-4 text-teal-600" />
                Today&apos;s Appointments
              </CardTitle>
              {data?.todayAppointmentsList && data.todayAppointmentsList.length > 0 && (
                <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                  {data.todayAppointmentsList.length} scheduled
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading && !data ? (
              <TableSkeleton rows={5} />
            ) : data?.todayAppointmentsList &&
              data.todayAppointmentsList.length > 0 ? (
              <ScrollArea className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Time
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Patient
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Doctor
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Treatment
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.todayAppointmentsList.map((appt) => (
                      <TableRow
                        key={appt.id}
                        className="group"
                      >
                        <TableCell className="whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {formatTime(appt.time)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700">
                            {appt.patientName}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {appt.doctorName ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {appt.treatmentType ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(appt.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-600">
                  No appointments today
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Appointments scheduled for today will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-teal-600" />
                Recent Patients
              </CardTitle>
              {data?.recentPatients && data.recentPatients.length > 0 && (
                <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                  Last {data.recentPatients.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading && !data ? (
              <TableSkeleton rows={5} />
            ) : data?.recentPatients && data.recentPatients.length > 0 ? (
              <ScrollArea className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        ID
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Name
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Phone
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Last Visit
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentPatients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        className="group"
                      >
                        <TableCell>
                          <span className="font-mono text-xs text-gray-500">
                            {patient.patientId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-900">
                            {patient.firstName}
                            {patient.lastName ? ` ${patient.lastName}` : ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {patient.phone}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDate(patient.lastVisitDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getCategoryBadge(patient.category)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-600">
                  No patients yet
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Registered patients will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview (7-day mini chart area) */}
      {data?.revenueLast7Days && data.revenueLast7Days.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-4 w-4 text-teal-600" />
                Revenue - Last 7 Days
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end gap-2 h-32">
              {data.revenueLast7Days.map((day) => {
                const maxRevenue = Math.max(
                  ...data.revenueLast7Days.map((d) => d.revenue),
                  1
                );
                const heightPercent = (day.revenue / maxRevenue) * 100;
                const dateObj = new Date(day.date + "T00:00:00");
                const dayLabel = dateObj.toLocaleDateString("en-IN", {
                  weekday: "short",
                });

                return (
                  <div
                    key={day.date}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="text-xs font-medium text-gray-600">
                      {formatCurrency(day.revenue)}
                    </span>
                    <div className="w-full max-w-[48px] rounded-t-md bg-teal-500 transition-all duration-500 hover:bg-teal-600"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                    <span className="text-xs text-gray-400">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
