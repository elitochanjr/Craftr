"use client";

import { useState, useTransition } from "react";
import type { Customer, OrderStatus, Role } from "@/generated/prisma/client";
import {
  createOrderAction,
  updateOrderAction,
  deleteOrderAction,
  type OrderInput,
} from "@/app/(app)/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { UsageList } from "@/components/inventory/usage-list";
import { LogUsageForm } from "@/components/inventory/log-usage-form";

// ── Types ──────────────────────────────────────────────────────────────────

type OrderRow = {
  id: string;
  status: OrderStatus;
  revenue: number | null;
  date: Date;
  notes: string | null;
  customerId: string;
  customer: { id: string; name: string };
  totalSupplyCost: number;
  _count: { stockMovements: number };
  createdAt: Date;
  updatedAt: Date;
};

type ItemOption = {
  id: string;
  name: string;
  unit: string;
  cost: number;
  quantity: number;
};

interface OrderFormData {
  customerId: string;
  revenue: string;
  notes: string;
  status: OrderStatus;
}

const EMPTY_FORM: OrderFormData = {
  customerId: "",
  revenue: "",
  notes: "",
  status: "ACTIVE",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function statusBadge(status: OrderStatus) {
  const cfg = {
    ACTIVE: {
      label: "Active",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    COMPLETED: {
      label: "Completed",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-muted text-muted-foreground",
    },
  } as const;
  const { label, className } = cfg[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface OrdersViewProps {
  orders: OrderRow[];
  customers: Customer[];
  items: ItemOption[];
  role: Role;
}

// ── Component ──────────────────────────────────────────────────────────────

export function OrdersView({ orders, customers, items, role }: OrdersViewProps) {
  const isAdmin = role === "ADMIN";
  const [, startTransition] = useTransition();

  type Mode = null | "view" | "edit" | "create";
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [form, setForm] = useState<OrderFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const [liveSupplyCost, setLiveSupplyCost] = useState<number | null>(null);

  function openCreate() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setMode("create");
  }

  function openView(o: OrderRow) {
    setSelected(o);
    setFormError(null);
    setLiveSupplyCost(null);
    setMode("view");
  }

  function openEdit(o: OrderRow) {
    setSelected(o);
    setForm({
      customerId: o.customerId,
      revenue: o.revenue != null ? String(o.revenue) : "",
      notes: o.notes ?? "",
      status: o.status,
    });
    setFormError(null);
    setMode("edit");
  }

  function handleSave() {
    setFormError(null);
    const input: OrderInput & { status: OrderStatus } = {
      customerId: form.customerId,
      revenue: form.revenue ? parseFloat(form.revenue) : undefined,
      notes: form.notes || undefined,
      status: form.status,
    };
    startTransition(async () => {
      const res =
        mode === "edit" && selected
          ? await updateOrderAction(selected.id, input)
          : await createOrderAction(input);
      if (res.error) setFormError(res.error);
      else setMode(null);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteOrderAction(deleteTarget.id);
      if (res.error) setDeleteError(res.error);
      else {
        setDeleteTarget(null);
        setMode(null);
      }
    });
  }

  function field<K extends keyof OrderFormData>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const supplyCost =
    liveSupplyCost !== null
      ? liveSupplyCost
      : selected?.totalSupplyCost ?? 0;

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Orders</h2>
            <p className="text-sm text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              New order
            </Button>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No orders yet</p>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? "Create an order to track customer fulfillment."
                : "No orders have been created yet."}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-start justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => openView(o)}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{o.customer.name}</p>
                    {statusBadge(o.status)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    <span>{new Date(o.date).toLocaleDateString()}</span>
                    {o.revenue != null && (
                      <span>Revenue: ${o.revenue.toFixed(2)}</span>
                    )}
                    <span>Supply cost: ${o.totalSupplyCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sheet ─────────────────────────────────────────────────────── */}
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
                <SheetTitle className="pr-6">{selected.customer.name}</SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4 space-y-4">
                <div className="flex items-center gap-2">
                  {statusBadge(selected.status)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(selected.date).toLocaleDateString()}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Revenue</dt>
                    <dd className="font-medium">
                      {selected.revenue != null
                        ? `$${selected.revenue.toFixed(2)}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Supply cost
                    </dt>
                    <dd className="font-medium">${supplyCost.toFixed(2)}</dd>
                  </div>
                </dl>

                {selected.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {selected.notes}
                    </p>
                  </div>
                )}

                {/* Log supply usage button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 w-full"
                  onClick={() => setUsageOpen(true)}
                >
                  Log supply usage
                </Button>

                {/* Live usage list */}
                <UsageList
                  orderId={selected.id}
                  refreshKey={usageRefreshKey}
                  onTotalCostChange={setLiveSupplyCost}
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
                  {mode === "edit" ? "Edit order" : "New order"}
                </SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4 space-y-4">
                {formError && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Customer *</Label>
                  <Select
                    value={form.customerId || "__none__"}
                    onValueChange={(v) =>
                      field("customerId", v === "__none__" ? "" : (v ?? ""))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {form.customerId
                          ? (customers.find((c) => c.id === form.customerId)?.name ?? "Select customer")
                          : "Select customer"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" disabled>
                        Select customer
                      </SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="o-rev">Revenue ($)</Label>
                  <Input
                    id="o-rev"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.revenue}
                    onChange={(e) => field("revenue", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {mode === "edit" && (
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => field("status", (v ?? "ACTIVE") as OrderStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {({ ACTIVE: "Active", COMPLETED: "Completed", CANCELLED: "Cancelled" } as Record<string, string>)[form.status] ?? form.status}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="o-notes">Notes</Label>
                  <Textarea
                    id="o-notes"
                    value={form.notes}
                    onChange={(e) => field("notes", e.target.value)}
                    placeholder="Special instructions, items ordered…"
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
                  disabled={!form.customerId}
                  className="flex-1"
                >
                  {mode === "edit" ? "Save changes" : "Create order"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Delete dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete order</DialogTitle>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Delete this order for{" "}
              <strong>{deleteTarget?.customer.name}</strong>? This cannot be
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

      {/* ── Log usage sheet ───────────────────────────────────────────── */}
      {selected && (
        <LogUsageForm
          open={usageOpen}
          onOpenChange={setUsageOpen}
          contextLabel={selected.customer.name}
          orderId={selected.id}
          items={items}
          onSuccess={() => setUsageRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
