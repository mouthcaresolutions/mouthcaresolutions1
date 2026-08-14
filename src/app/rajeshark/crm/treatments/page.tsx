"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Stethoscope,
  Plus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Search,
  IndianRupee,
  Clock,
  Pencil,
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

interface Treatment {
  id: string;
  name: string;
  category: string | null;
  price: number;
  duration: number;
  description: string | null;
  active: number;
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

function getCategoryBadge(category: string | null) {
  if (!category) return <span className="text-sm text-gray-400">—</span>;
  const colorMap: Record<string, string> = {
    consultation: "bg-blue-100 text-blue-700 border-blue-200",
    cleaning: "bg-cyan-100 text-cyan-700 border-cyan-200",
    filling: "bg-amber-100 text-amber-700 border-amber-200",
    extraction: "bg-red-100 text-red-700 border-red-200",
    cosmetic: "bg-pink-100 text-pink-700 border-pink-200",
    orthodontic: "bg-purple-100 text-purple-700 border-purple-200",
    surgical: "bg-orange-100 text-orange-700 border-orange-200",
    preventive: "bg-emerald-100 text-emerald-700 border-emerald-200",
    diagnostic: "bg-indigo-100 text-indigo-700 border-indigo-200",
    rootcanal: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const cls = colorMap[category.toLowerCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <Badge variant="outline" className={cls}>
      {category}
    </Badge>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function TreatmentsPage() {
  // Data state
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form state
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    duration: "30",
    description: "",
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
  // Fetch treatments
  // ============================================================
  const fetchTreatments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // SEC-C05 FIX: Cookie auth handled by middleware
      const params = new URLSearchParams();
      if (activeCategory !== "All") params.set("category", activeCategory);

      const res = await fetch(`/api/crm/treatments?${params.toString()}`, {
        credentials: 'include', headers: { "Content-Type": "application/json" },
      });

      if (res.status === 401) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`Failed to load treatments (HTTP ${res.status})`);

      const json = await res.json();
      setTreatments(json.treatments ?? []);
      setCategories(json.categories ?? []);
    } catch (err) {
      console.error("Fetch treatments error:", err);
      setError(err instanceof Error ? err.message : "Failed to load treatments.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  // ============================================================
  // Filtered treatments (client-side search)
  // ============================================================
  const filteredTreatments = treatments.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.category?.toLowerCase().includes(q) ?? false) ||
      (t.description?.toLowerCase().includes(q) ?? false)
    );
  });

  // ============================================================
  // Open dialog for add/edit
  // ============================================================
  const openAddDialog = () => {
    setEditMode(false);
    setEditId(null);
    setForm({ name: "", category: "", price: "", duration: "30", description: "" });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (treatment: Treatment) => {
    setEditMode(true);
    setEditId(treatment.id);
    setForm({
      name: treatment.name,
      category: treatment.category ?? "",
      price: String(treatment.price),
      duration: String(treatment.duration),
      description: treatment.description ?? "",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // ============================================================
  // Submit
  // ============================================================
  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Treatment name is required";
    if (!form.price || parseFloat(form.price) < 0) errors.price = "Valid price is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        category: form.category.trim() || null,
        price: parseFloat(form.price) || 0,
        duration: parseInt(form.duration, 10) || 30,
        description: form.description.trim() || null,
      };

      if (editMode && editId) {
        body.id = editId;
      }

      const method = editMode ? "PUT" : "POST";
      const res = await fetch("/api/crm/treatments", {
        method,
        credentials: 'include',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to ${editMode ? "update" : "add"} treatment`);
      }

      setDialogOpen(false);
      fetchTreatments();
    } catch (err) {
      console.error("Submit treatment error:", err);
      setFormErrors({ submit: err instanceof Error ? err.message : "Failed to save treatment" });
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
            <Stethoscope className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Treatment Price List</h1>
            <p className="text-sm text-gray-500">Manage treatment procedures and pricing</p>
          </div>
        </div>
        <Button onClick={openAddDialog} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Treatment
        </Button>
      </div>

      {/* Category Tabs + Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("All")}
                className={activeCategory === "All" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={activeCategory === cat ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search treatments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {/* Treatments Table */}
      {!loading && !error && filteredTreatments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16">
          <Stethoscope className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600">No Treatments</h3>
          <p className="mt-1 text-sm text-gray-400">
            {searchQuery ? "No treatments match your search." : "No treatments found in this category."}
          </p>
        </div>
      )}

      {!loading && !error && filteredTreatments.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead>Treatment Name</TableHead>
                    <TableHead className="w-[140px]">Category</TableHead>
                    <TableHead className="text-right w-[120px]">Price</TableHead>
                    <TableHead className="hidden sm:table-cell w-[100px]">Duration</TableHead>
                    <TableHead className="w-[80px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTreatments.map((t) => (
                    <TableRow key={t.id} className="transition-colors hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{t.name}</p>
                          {t.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[300px]">{t.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(t.category)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IndianRupee className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-semibold text-gray-900">{t.price.toLocaleString("en-IN")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{t.duration} min</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit treatment"
                          onClick={() => openEditDialog(t)}
                        >
                          <Pencil className="h-4 w-4 text-teal-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Count */}
      {!loading && !error && filteredTreatments.length > 0 && (
        <p className="text-sm text-gray-500 text-right">
          Showing {filteredTreatments.length} of {treatments.length} treatments
        </p>
      )}

      {/* ============================================================ */}
      {/* Add/Edit Treatment Dialog */}
      {/* ============================================================ */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setFormErrors({}); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editMode ? (
                <><Pencil className="h-5 w-5 text-teal-600" /> Edit Treatment</>
              ) : (
                <><Plus className="h-5 w-5 text-teal-600" /> Add Treatment</>
              )}
            </DialogTitle>
            <DialogDescription>
              {editMode ? "Update treatment details." : "Add a new treatment to the price list."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Treatment Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g., Dental Cleaning"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Category</Label>
              <Input
                placeholder="e.g., Cleaning, Filling, Cosmetic"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Price (₹) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
                {formErrors.price && <p className="text-xs text-red-500">{formErrors.price}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Duration (min)</Label>
                <Input
                  type="number"
                  min={5}
                  placeholder="30"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                placeholder="Treatment description..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            {formErrors.submit && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{formErrors.submit}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : editMode ? (
                <><Pencil className="mr-2 h-4 w-4" />Update Treatment</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" />Add Treatment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
