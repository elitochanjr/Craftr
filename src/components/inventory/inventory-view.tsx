"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Category, Supplier, Role } from "@/generated/prisma/client";
import {
  createItemAction,
  updateItemAction,
  deleteItemAction,
  type ItemInput,
} from "@/app/(app)/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  AlertTriangle,
  MapPin,
  Barcode,
  ArrowUpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemPhotoUpload } from "@/components/inventory/item-photo-upload";
import { BarcodeScannerFab } from "@/components/inventory/barcode-scanner-fab";
import { QrLabelDialog } from "@/components/inventory/qr-label-dialog";
import { MovementHistory } from "@/components/inventory/movement-history";
import { LogPurchaseForm } from "@/components/inventory/log-purchase-form";
import { LogAdjustmentForm } from "@/components/inventory/log-adjustment-form";

// ── Types ──────────────────────────────────────────────────────────────────

type ItemRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  cost: number;
  location: string | null;
  photoUrl: string | null;
  notes: string | null;
  sku: string | null;
  categoryId: string;
  category: { id: string; name: string };
  supplierId: string | null;
  supplier: { id: string; name: string } | null;
};

type SortKey = "name" | "category" | "quantity" | "location" | "supplier";
type SortDir = "asc" | "desc";

interface ItemFormData {
  name: string;
  categoryId: string;
  quantity: string;
  unit: string;
  lowStockThreshold: string;
  cost: string;
  location: string;
  supplierId: string;
  sku: string;
  notes: string;
}

const EMPTY_FORM: ItemFormData = {
  name: "",
  categoryId: "",
  quantity: "0",
  unit: "unit",
  lowStockThreshold: "5",
  cost: "0",
  location: "",
  supplierId: "",
  sku: "",
  notes: "",
};

const NO_SUPPLIER = "__none__";

// ── Props ──────────────────────────────────────────────────────────────────

interface InventoryViewProps {
  items: ItemRow[];
  categories: Category[];
  suppliers: Supplier[];
  role: Role;
}

// ── Component ──────────────────────────────────────────────────────────────

export function InventoryView({
  items,
  categories,
  suppliers,
  role,
}: InventoryViewProps) {
  const isAdmin = role === "ADMIN";
  const [, startTransition] = useTransition();

  // ── Filter / sort state
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterLoc, setFilterLoc] = useState<string>("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "name",
    dir: "asc",
  });

  // ── Sheet / dialog state
  type Mode = null | "view" | "edit" | "create";
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<ItemRow | null>(null);
  const [form, setForm] = useState<ItemFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ItemRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [noMatchMsg, setNoMatchMsg] = useState<string | null>(null);
  const [qrLoc, setQrLoc] = useState<string | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [movementRefreshKey, setMovementRefreshKey] = useState(0);

  // Pre-apply ?location= query param (from scanned QR code)
  // Pre-apply ?item= query param (from notification click)
  const searchParams = useSearchParams();
  useEffect(() => {
    const loc = searchParams.get("location");
    if (loc) setFilterLoc(loc ?? "");
  }, [searchParams]);
  useEffect(() => {
    const itemId = searchParams.get("item");
    if (itemId) {
      const target = items.find((i) => i.id === itemId);
      if (target) {
        setSelected(target);
        setMode("view");
      }
    }
  }, [searchParams, items]);

  // ── Unique locations from items
  const locations = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.location).filter(Boolean) as string[])
      ).sort(),
    [items]
  );

  // ── Active filter count for badge
  const activeFilters =
    (filterCat ? 1 : 0) + (filterSupplier ? 1 : 0) + (filterLoc ? 1 : 0);

  // ── Derived: filtered + sorted items
  const displayed = useMemo(() => {
    let list = items;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (filterCat) list = list.filter((i) => i.categoryId === filterCat);
    if (filterSupplier)
      list = list.filter((i) => i.supplierId === filterSupplier);
    if (filterLoc) list = list.filter((i) => i.location === filterLoc);

    list = [...list].sort((a, b) => {
      let av = "";
      let bv = "";
      switch (sort.key) {
        case "name":
          av = a.name;
          bv = b.name;
          break;
        case "category":
          av = a.category.name;
          bv = b.category.name;
          break;
        case "quantity":
          return sort.dir === "asc"
            ? a.quantity - b.quantity
            : b.quantity - a.quantity;
        case "location":
          av = a.location ?? "";
          bv = b.location ?? "";
          break;
        case "supplier":
          av = a.supplier?.name ?? "";
          bv = b.supplier?.name ?? "";
          break;
      }
      const cmp = av.localeCompare(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [items, search, filterCat, filterSupplier, filterLoc, sort]);

  // ── Handlers ───────────────────────────────────────────────────────────

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function openCreate(prefillSku?: string) {
    setSelected(null);
    setForm({ ...EMPTY_FORM, sku: prefillSku ?? "" });
    setFormError(null);
    setMode("create");
  }

  function handleBarcodeScan(barcode: string) {
    const match = items.find((i) => i.sku === barcode);
    if (match) {
      openView(match);
    } else {
      setNoMatchMsg(`No item found for "${barcode}"`);
      setTimeout(() => {
        setNoMatchMsg(null);
        openCreate(barcode);
      }, 1500);
    }
  }

  function openView(item: ItemRow) {
    setSelected(item);
    setFormError(null);
    setMode("view");
  }

  function openEdit(item: ItemRow) {
    setSelected(item);
    setForm({
      name: item.name,
      categoryId: item.categoryId,
      quantity: String(item.quantity),
      unit: item.unit,
      lowStockThreshold: String(item.lowStockThreshold),
      cost: String(item.cost),
      location: item.location ?? "",
      supplierId: item.supplierId ?? "",
      sku: item.sku ?? "",
      notes: item.notes ?? "",
    });
    setFormError(null);
    setMode("edit");
  }

  function handleSave() {
    setFormError(null);
    const input: ItemInput = {
      name: form.name,
      categoryId: form.categoryId,
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit || "unit",
      lowStockThreshold: parseFloat(form.lowStockThreshold) || 5,
      cost: parseFloat(form.cost) || 0,
      location: form.location || undefined,
      supplierId:
        form.supplierId && form.supplierId !== NO_SUPPLIER
          ? form.supplierId
          : undefined,
      sku: form.sku || undefined,
      notes: form.notes || undefined,
    };
    startTransition(async () => {
      const res =
        mode === "edit" && selected
          ? await updateItemAction(selected.id, input)
          : await createItemAction(input);
      if (res.error) setFormError(res.error);
      else setMode(null);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteItemAction(deleteTarget.id);
      if (res.error) setDeleteError(res.error);
      else {
        setDeleteTarget(null);
        setMode(null);
      }
    });
  }

  function field<K extends keyof ItemFormData>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  function isLowStock(item: ItemRow) {
    return item.quantity <= item.lowStockThreshold;
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col)
      return <ChevronUp className="h-3 w-3 opacity-20 ml-1 inline" />;
    return sort.dir === "asc" ? (
      <ChevronUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1 inline" />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6">
      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search items…"
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => openCreate()} className="gap-1.5 shrink-0">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New item</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          {/* Category filter */}
          <Select
            value={filterCat || "__all__"}
            onValueChange={(v) => setFilterCat(v === "__all__" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-32">
              <SelectValue>
                {filterCat
                  ? (categories.find((c) => c.id === filterCat)?.name ?? "All categories")
                  : "All categories"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Supplier filter */}
          <Select
            value={filterSupplier || "__all__"}
            onValueChange={(v) => setFilterSupplier(v === "__all__" ? "" : (v ?? ""))}
          >
            <SelectTrigger className="h-8 text-xs w-auto min-w-32">
              <SelectValue>
                {filterSupplier
                  ? (suppliers.find((s) => s.id === filterSupplier)?.name ?? "All suppliers")
                  : "All suppliers"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All suppliers</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location filter */}
          {locations.length > 0 && (
            <div className="flex items-center gap-1">
              <Select
                value={filterLoc || "__all__"}
                onValueChange={(v) => setFilterLoc(v === "__all__" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="h-8 text-xs w-auto min-w-32">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All locations</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* QR label button — admin only, only when a location is selected */}
              {isAdmin && filterLoc && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 px-2"
                  title={`Generate QR label for "${filterLoc}"`}
                  onClick={() => setQrLoc(filterLoc)}
                >
                  <span className="text-[10px]">QR</span>
                </Button>
              )}
            </div>
          )}

          {/* Clear filters */}
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => {
                setFilterCat("");
                setFilterSupplier("");
                setFilterLoc("");
              }}
            >
              <X className="h-3 w-3" />
              Clear filters
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-0.5">
                {activeFilters}
              </Badge>
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {displayed.length} item{displayed.length !== 1 ? "s" : ""}
          {items.length !== displayed.length ? ` of ${items.length}` : ""}
        </p>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {displayed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
          {items.length === 0 ? (
            <>
              <p className="font-medium text-sm">No items yet</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin
                  ? "Add your first inventory item to get started."
                  : "No inventory items have been added yet."}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-sm">No results</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Desktop table ─────────────────────────────────────────────── */}
      {displayed.length > 0 && (
        <div className="hidden lg:block rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {(
                  [
                    { key: "name", label: "Name" },
                    { key: "category", label: "Category" },
                    { key: "quantity", label: "Qty" },
                    { key: "location", label: "Location" },
                    { key: "supplier", label: "Supplier" },
                  ] as { key: SortKey; label: string }[]
                ).map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <SortIcon col={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => openView(item)}
                >
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.category.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        isLowStock(item) && "text-destructive"
                      )}
                    >
                      {isLowStock(item) && (
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                      )}
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.location ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.supplier?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Mobile card grid ──────────────────────────────────────────── */}
      {displayed.length > 0 && (
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayed.map((item) => (
            <button
              key={item.id}
              className="text-left rounded-lg border border-border bg-background p-4 hover:bg-muted/50 transition-colors space-y-2"
              onClick={() => openView(item)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-snug">{item.name}</p>
                {isLowStock(item) && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                  >
                    Low
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{item.category.name}</span>
                <span
                  className={cn(
                    item.quantity <= item.lowStockThreshold && "text-destructive font-medium"
                  )}
                >
                  {item.quantity} {item.unit}
                </span>
                {item.location && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Detail / Edit / Create Sheet ──────────────────────────────── */}
      <Sheet
        open={mode !== null}
        onOpenChange={(open) => !open && setMode(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto"
        >
          {mode === "view" && selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6">{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4 space-y-4">
                {/* Low stock alert */}
                {isLowStock(selected) && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      Low stock — {selected.quantity} {selected.unit} remaining
                    </span>
                  </div>
                )}

                {/* Photo upload (admin) / display (staff) */}
                {isAdmin ? (
                  <ItemPhotoUpload
                    itemId={selected.id}
                    currentUrl={selected.photoUrl}
                  />
                ) : (
                  <div className="w-full h-40 rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                    {selected.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selected.photoUrl}
                        alt={selected.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>
                )}

                {/* Fields */}
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Category</dt>
                    <dd className="font-medium">{selected.category.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Quantity</dt>
                    <dd
                      className={cn(
                        "font-medium",
                        isLowStock(selected) && "text-destructive"
                      )}
                    >
                      {selected.quantity} {selected.unit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Low-stock threshold
                    </dt>
                    <dd className="font-medium">
                      {selected.lowStockThreshold} {selected.unit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Cost per unit
                    </dt>
                    <dd className="font-medium">
                      ${selected.cost.toFixed(2)}
                    </dd>
                  </div>
                  {selected.location && (
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Location
                      </dt>
                      <dd className="font-medium">{selected.location}</dd>
                    </div>
                  )}
                  {selected.supplier && (
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Supplier
                      </dt>
                      <dd className="font-medium">{selected.supplier.name}</dd>
                    </div>
                  )}
                  {selected.sku && (
                    <div>
                      <dt className="text-xs text-muted-foreground">SKU / Barcode</dt>
                      <dd className="font-medium font-mono text-xs">
                        {selected.sku}
                      </dd>
                    </div>
                  )}
                </dl>

                {selected.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {selected.notes}
                    </p>
                  </div>
                )}

                {/* Stock action buttons (admin only) */}
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 flex-1"
                      onClick={() => setPurchaseOpen(true)}
                    >
                      <ArrowUpCircle className="h-3.5 w-3.5 text-green-600" />
                      Log purchase
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 flex-1"
                      onClick={() => setAdjustmentOpen(true)}
                    >
                      Adjust stock
                    </Button>
                  </div>
                )}

                {/* Movement history */}
                <MovementHistory
                  itemId={selected.id}
                  refreshKey={movementRefreshKey}
                />
              </div>

              {isAdmin && (
                <SheetFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive gap-1.5"
                    onClick={() => {
                      setDeleteTarget(selected);
                      setDeleteError(null);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={() => openEdit(selected)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </SheetFooter>
              )}
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>
                  {mode === "edit" ? "Edit item" : "New item"}
                </SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4 space-y-4">
                {formError && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="i-name">Name *</Label>
                  <Input
                    id="i-name"
                    value={form.name}
                    onChange={(e) => field("name", e.target.value)}
                    placeholder="Cotton thread"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select
                    value={form.categoryId || "__none__"}
                    onValueChange={(v) =>
                      field("categoryId", v === "__none__" ? "" : (v ?? ""))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {form.categoryId
                          ? (categories.find((c) => c.id === form.categoryId)?.name ?? "Select category")
                          : "Select category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" disabled>
                        Select category
                      </SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity + Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="i-qty">Quantity *</Label>
                    <Input
                      id="i-qty"
                      type="number"
                      min={0}
                      step="any"
                      value={form.quantity}
                      onChange={(e) => field("quantity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="i-unit">Unit</Label>
                    <Input
                      id="i-unit"
                      value={form.unit}
                      onChange={(e) => field("unit", e.target.value)}
                      placeholder="unit"
                    />
                  </div>
                </div>

                {/* Low-stock threshold + Cost */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="i-threshold">Low-stock alert at</Label>
                    <Input
                      id="i-threshold"
                      type="number"
                      min={0}
                      step="any"
                      value={form.lowStockThreshold}
                      onChange={(e) =>
                        field("lowStockThreshold", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="i-cost">Cost / unit ($)</Label>
                    <Input
                      id="i-cost"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.cost}
                      onChange={(e) => field("cost", e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label htmlFor="i-loc">
                    <MapPin className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                    Storage location
                  </Label>
                  <Input
                    id="i-loc"
                    value={form.location}
                    onChange={(e) => field("location", e.target.value)}
                    placeholder="Bin A3, Shelf 2…"
                  />
                </div>

                {/* Supplier */}
                <div className="space-y-1.5">
                  <Label>Supplier</Label>
                  <Select
                    value={form.supplierId || NO_SUPPLIER}
                    onValueChange={(v) =>
                      field("supplierId", v === NO_SUPPLIER ? "" : (v ?? ""))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {form.supplierId
                          ? (suppliers.find((s) => s.id === form.supplierId)?.name ?? "No supplier")
                          : "No supplier"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SUPPLIER}>No supplier</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SKU */}
                <div className="space-y-1.5">
                  <Label htmlFor="i-sku">
                    <Barcode className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                    SKU / Barcode
                  </Label>
                  <Input
                    id="i-sku"
                    value={form.sku}
                    onChange={(e) => field("sku", e.target.value)}
                    placeholder="Optional barcode or product code"
                    className="font-mono"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="i-notes">Notes</Label>
                  <Textarea
                    id="i-notes"
                    value={form.notes}
                    onChange={(e) => field("notes", e.target.value)}
                    placeholder="Color, size, brand notes…"
                    rows={3}
                  />
                </div>
              </div>

              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    mode === "edit" && selected
                      ? setMode("view")
                      : setMode(null)
                  }
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!form.name.trim() || !form.categoryId}
                  className="flex-1"
                >
                  {mode === "edit" ? "Save changes" : "Add item"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Delete dialog ────────────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item</DialogTitle>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Delete <strong>{deleteTarget?.name}</strong>? This cannot be
              undone.
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {deleteError ? "Close" : "Cancel"}
            </DialogClose>
            {!deleteError && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Log Purchase sheet ────────────────────────────────────────── */}
      {selected && (
        <LogPurchaseForm
          open={purchaseOpen}
          onOpenChange={setPurchaseOpen}
          itemId={selected.id}
          itemName={selected.name}
          onSuccess={() => setMovementRefreshKey((k) => k + 1)}
        />
      )}

      {/* ── Log Adjustment sheet ──────────────────────────────────────── */}
      {selected && (
        <LogAdjustmentForm
          open={adjustmentOpen}
          onOpenChange={setAdjustmentOpen}
          itemId={selected.id}
          itemName={selected.name}
          currentQuantity={selected.quantity}
          unit={selected.unit}
          onSuccess={() => setMovementRefreshKey((k) => k + 1)}
        />
      )}

      {/* ── QR label dialog ───────────────────────────────────────────── */}
      {qrLoc && (
        <QrLabelDialog
          open={!!qrLoc}
          onOpenChange={(v) => !v && setQrLoc(null)}
          location={qrLoc}
          items={items
            .filter((i) => i.location === qrLoc)
            .sort((a, b) => b.quantity - a.quantity)
            .map((i) => ({
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
            }))}
        />
      )}

      {/* ── Barcode scanner FAB (mobile only) ─────────────────────────── */}
      <BarcodeScannerFab onScan={handleBarcodeScan} />

      {/* ── No-match toast ────────────────────────────────────────────── */}
      {noMatchMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 lg:hidden rounded-full bg-foreground text-background px-4 py-2 text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {noMatchMsg}
        </div>
      )}
    </div>
  );
}
