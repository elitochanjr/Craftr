"use client";

import { useState, useTransition } from "react";
import { logAdjustmentAction } from "@/app/(app)/inventory/movement-actions";
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

interface LogAdjustmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  currentQuantity: number;
  unit: string;
  onSuccess?: () => void;
}

export function LogAdjustmentForm({
  open,
  onOpenChange,
  itemId,
  itemName,
  currentQuantity,
  unit,
  onSuccess,
}: LogAdjustmentFormProps) {
  const [form, setForm] = useState({ delta: "", reason: "" });
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function reset() {
    setForm({ delta: "", reason: "" });
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    const delta = parseFloat(form.delta);
    if (isNaN(delta) || delta === 0) {
      setError("Delta must be a non-zero number.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Reason is required.");
      return;
    }
    startTransition(async () => {
      const res = await logAdjustmentAction({
        itemId,
        delta,
        reason: form.reason,
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

  const delta = parseFloat(form.delta) || 0;
  const newQty = currentQuantity + delta;

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
          <SheetTitle>Adjust stock — {itemName}</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-4 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-border px-3 py-2 text-sm">
            Current:{" "}
            <span className="font-medium">
              {currentQuantity} {unit}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adj-delta">Adjustment (+ or −) *</Label>
            <Input
              id="adj-delta"
              type="number"
              step="any"
              value={form.delta}
              onChange={(e) => setForm((f) => ({ ...f, delta: e.target.value }))}
              placeholder="+10 or -5"
            />
            {form.delta && !isNaN(delta) && (
              <p className="text-xs text-muted-foreground">
                New quantity:{" "}
                <span
                  className={
                    newQty < 0 ? "text-destructive font-medium" : "font-medium"
                  }
                >
                  {newQty} {unit}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adj-reason">Reason *</Label>
            <Textarea
              id="adj-reason"
              value={form.reason}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              placeholder="Counted inventory, item damaged, returned…"
              rows={2}
            />
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
            disabled={!form.delta || !form.reason.trim()}
          >
            Apply adjustment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
