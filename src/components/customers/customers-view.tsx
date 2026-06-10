"use client";

import { useState, useTransition } from "react";
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  type CustomerInput,
} from "@/app/(app)/customers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Users, Mail, Phone, ShoppingBag } from "lucide-react";

type CustomerWithStats = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
  orderCount: number;
  totalRevenue: number;
};

const EMPTY: CustomerInput = { name: "", email: "", phone: "" };

interface CustomersViewProps {
  customers: CustomerWithStats[];
}

export function CustomersView({ customers }: CustomersViewProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerWithStats | null>(null);
  const [viewTarget, setViewTarget] = useState<CustomerWithStats | null>(null);
  const [form, setForm] = useState<CustomerInput>(EMPTY);

  const [deleteTarget, setDeleteTarget] = useState<CustomerWithStats | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openCreate() {
    setEditTarget(null);
    setViewTarget(null);
    setForm(EMPTY);
    setError(null);
    setSheetOpen(true);
  }

  function openView(c: CustomerWithStats) {
    setViewTarget(c);
    setEditTarget(null);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "" });
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(c: CustomerWithStats) {
    setEditTarget(c);
    setViewTarget(null);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "" });
    setError(null);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = editTarget
        ? await updateCustomerAction(editTarget.id, form)
        : await createCustomerAction(form);
      if (res.error) setError(res.error);
      else setSheetOpen(false);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteCustomerAction(deleteTarget.id);
      if (res.error) setDeleteError(res.error);
      else {
        setDeleteTarget(null);
        setSheetOpen(false);
      }
    });
  }

  function field(key: keyof CustomerInput, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isEditing = !!editTarget;
  const isViewing = !!viewTarget && !isEditing;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Customers</h2>
            <p className="text-sm text-muted-foreground">
              {customers.length} customer{customers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No customers yet</p>
            <p className="text-xs text-muted-foreground">
              Add customers to link them to orders.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {customers.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => openView(c)}
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </span>
                    )}
                    {c.orderCount > 0 && (
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {c.orderCount} order{c.orderCount !== 1 ? "s" : ""} ·{" "}
                        ₱{c.totalRevenue.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isViewing
                ? viewTarget?.name
                : editTarget
                ? "Edit customer"
                : "Add customer"}
            </SheetTitle>
          </SheetHeader>

          {/* View mode */}
          {isViewing && viewTarget ? (
            <>
              <div className="px-4 py-4 space-y-4">
                <dl className="space-y-3 text-sm">
                  {viewTarget.email && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Email</dt>
                      <dd className="font-medium">{viewTarget.email}</dd>
                    </div>
                  )}
                  {viewTarget.phone && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Phone</dt>
                      <dd className="font-medium">{viewTarget.phone}</dd>
                    </div>
                  )}
                </dl>

                {/* Order summary */}
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Order summary
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Orders</p>
                      <p className="font-semibold text-lg">
                        {viewTarget.orderCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total revenue
                      </p>
                      <p className="font-semibold text-lg">
                        ₱{viewTarget.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <SheetFooter className="gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive gap-1.5"
                  onClick={() => {
                    setDeleteTarget(viewTarget);
                    setDeleteError(null);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={() => openEdit(viewTarget)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </SheetFooter>
            </>
          ) : (
            /* Create / Edit form */
            <>
              <div className="px-4 py-4 space-y-4 flex-1">
                {error && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">Name *</Label>
                  <Input
                    id="c-name"
                    value={form.name}
                    onChange={(e) => field("name", e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => field("email", e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input
                    id="c-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => field("phone", e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>
              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    editTarget ? openView(editTarget) : setSheetOpen(false)
                  }
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!form.name.trim()}
                  className="flex-1"
                >
                  {editTarget ? "Save changes" : "Add customer"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete customer</DialogTitle>
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
    </div>
  );
}
