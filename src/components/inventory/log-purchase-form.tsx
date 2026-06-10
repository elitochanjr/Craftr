"use client";

import { useState, useTransition } from "react";
import { logPurchaseAction } from "@/app/(app)/inventory/movement-actions";
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

interface LogPurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  /** Called after a successful purchase so parent can refresh */
  onSuccess?: () => void;
}

export function LogPurchaseForm({
  open,
  onOpenChange,
  itemId,
  itemName,
  onSuccess,
}: LogPurchaseFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    date: today,
    vendorName: "",
    quantity: "",
    unitCost: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function field(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function reset() {
    setForm({ date: today, vendorName: "", quantity: "", unitCost: "" });
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    const qty = parseFloat(form.quantity);
    const cost = parseFloat(form.unitCost);
    if (!form.quantity || isNaN(qty) || qty <= 0) {
      setError("Enter a valid quantity greater than zero.");
      return;
    }
    if (!form.unitCost || isNaN(cost) || cost < 0) {
      setError("Enter a valid unit cost (0 or more).");
      return;
    }
    startTransition(async () => {
      const res = await logPurchaseAction({
        itemId,
        date: form.date,
        vendorName: form.vendorName || undefined,
        quantity: qty,
        unitCost: cost,
      });
      if (res.error) {
        setError(res.error);
      } else {
        reset();
        onOpenChange(false);
        onSuccess?.();
      }
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log purchase — {itemName}</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-4 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="p-date">Date *</Label>
            <Input
              id="p-date"
              type="date"
              value={form.date}
              onChange={(e) => field("date", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-vendor">Vendor name</Label>
            <Input
              id="p-vendor"
              value={form.vendorName}
              onChange={(e) => field("vendorName", e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-qty">Quantity received *</Label>
              <Input
                id="p-qty"
                type="number"
                min={1}
                step="any"
                value={form.quantity}
                onChange={(e) => field("quantity", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cost">Unit cost (₱) *</Label>
              <Input
                id="p-cost"
                type="number"
                min={0}
                step="0.01"
                value={form.unitCost}
                onChange={(e) => field("unitCost", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!form.quantity || !form.unitCost || !form.date}
          >
            Log purchase
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
