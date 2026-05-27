"use client";

import { useState, useTransition } from "react";
import type { Supplier } from "@/generated/prisma/client";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  type SupplierInput,
} from "@/app/(app)/suppliers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Truck, Globe, Mail, Phone } from "lucide-react";

const EMPTY: SupplierInput = {
  name: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
};

interface SuppliersViewProps {
  suppliers: Supplier[];
}

export function SuppliersView({ suppliers }: SuppliersViewProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Sheet drawer
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierInput>(EMPTY);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY);
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditTarget(s);
    setForm({
      name: s.name,
      website: s.website ?? "",
      contactEmail: s.contactEmail ?? "",
      contactPhone: s.contactPhone ?? "",
      notes: s.notes ?? "",
    });
    setError(null);
    setSheetOpen(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = editTarget
        ? await updateSupplierAction(editTarget.id, form)
        : await createSupplierAction(form);

      if (res.error) {
        setError(res.error);
      } else {
        setSheetOpen(false);
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteSupplierAction(deleteTarget.id);
      setDeleteTarget(null);
    });
  }

  function field(key: keyof SupplierInput, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Suppliers</h2>
            <p className="text-sm text-muted-foreground">
              {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add supplier
          </Button>
        </div>

        {/* List */}
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No suppliers yet</p>
            <p className="text-xs text-muted-foreground">
              Add suppliers to track where you source your materials.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {s.contactEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {s.contactEmail}
                      </span>
                    )}
                    {s.contactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {s.contactPhone}
                      </span>
                    )}
                    {s.website && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {s.website}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(s)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(s)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editTarget ? "Edit supplier" : "Add supplier"}
            </SheetTitle>
          </SheetHeader>

          <div className="px-4 py-4 space-y-4 flex-1">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="s-name">Name *</Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
                placeholder="e.g. Paper Source Co."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">Contact email</Label>
              <Input
                id="s-email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => field("contactEmail", e.target.value)}
                placeholder="orders@supplier.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-phone">Contact phone</Label>
              <Input
                id="s-phone"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => field("contactPhone", e.target.value)}
                placeholder="+1 555 000 0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-website">Website</Label>
              <Input
                id="s-website"
                type="url"
                value={form.website}
                onChange={(e) => field("website", e.target.value)}
                placeholder="https://supplier.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-notes">Notes</Label>
              <Textarea
                id="s-notes"
                value={form.notes}
                onChange={(e) => field("notes", e.target.value)}
                placeholder="Min order, lead time, etc."
                rows={3}
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setSheetOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex-1"
            >
              {editTarget ? "Save changes" : "Add supplier"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete supplier</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.name}</strong>? Items linked to this
            supplier will be unlinked. This cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
