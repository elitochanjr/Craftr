"use client";

import { useState, useTransition } from "react";
import { logUsageAction } from "@/app/(app)/inventory/movement-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type ItemOption = {
  id: string;
  name: string;
  unit: string;
  cost: number;
  quantity: number;
};

interface LogUsageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Context label shown in the header, e.g. order customer name or project name */
  contextLabel: string;
  /** Exactly one of orderId / projectId must be set */
  orderId?: string;
  projectId?: string;
  /** All available inventory items */
  items: ItemOption[];
  onSuccess?: () => void;
}

export function LogUsageForm({
  open,
  onOpenChange,
  contextLabel,
  orderId,
  projectId,
  items,
  onSuccess,
}: LogUsageFormProps) {
  const [form, setForm] = useState({
    itemId: "",
    quantity: "",
    unitCost: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function reset() {
    setForm({ itemId: "", quantity: "", unitCost: "" });
    setError(null);
  }

  function handleItemChange(id: string) {
    const item = items.find((i) => i.id === id);
    setForm((f) => ({
      ...f,
      itemId: id,
      unitCost: item ? String(item.cost) : "",
    }));
  }

  function handleSubmit() {
    setError(null);
    const qty = parseFloat(form.quantity);
    const cost = parseFloat(form.unitCost);
    if (!form.itemId) {
      setError("Select an item.");
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setError("Unit cost cannot be negative.");
      return;
    }
    startTransition(async () => {
      const res = await logUsageAction({
        itemId: form.itemId,
        quantity: qty,
        unitCost: cost,
        orderId,
        projectId,
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

  const selectedItem = items.find((i) => i.id === form.itemId);

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
          <SheetTitle>Log supply usage — {contextLabel}</SheetTitle>
        </SheetHeader>
        <div className="px-4 py-4 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Item *</Label>
            <Select
              value={form.itemId || "__none__"}
              onValueChange={(v) =>
                handleItemChange(v === "__none__" ? "" : (v ?? ""))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" disabled>
                  Select item
                </SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      ({item.quantity} {item.unit} in stock)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-qty">Quantity used *</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  id="u-qty"
                  type="number"
                  min={0.001}
                  step="any"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  placeholder="0"
                />
                {selectedItem && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {selectedItem.unit}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-cost">Unit cost ($)</Label>
              <Input
                id="u-cost"
                type="number"
                min={0}
                step="0.01"
                value={form.unitCost}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unitCost: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Running cost preview */}
          {form.quantity && form.unitCost && (
            <p className="text-xs text-muted-foreground">
              Total cost:{" "}
              <span className="font-medium text-foreground">
                ${(parseFloat(form.quantity) * parseFloat(form.unitCost)).toFixed(2)}
              </span>
            </p>
          )}
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
            disabled={!form.itemId || !form.quantity}
          >
            Log usage
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
