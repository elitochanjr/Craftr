"use client";

import { useState, useTransition, useMemo } from "react";
import { saveCostingAction } from "@/app/(app)/products/costing-actions";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AvailableItem = { id: string; name: string; unit: string; cost: number };
type AvailableOverhead = { id: string; name: string; costPerUse: number };

type MaterialRow = {
  itemId: string;
  quantity: number;
  item: AvailableItem;
};

interface ProductCostingProps {
  productId: string;
  initial: {
    laborRatePerHour: number | null;
    laborTimeMinutes: number | null;
    generalExpensesPercent: number;
    outputPieces: number;
    taxEnabled: boolean;
    markupPercent: number;
    discountPercent: number;
    finalRetailPrice: number | null;
    materials: MaterialRow[];
    overheadIds: string[];
  };
  availableItems: AvailableItem[];
  availableOverheads: AvailableOverhead[];
  isAdmin: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNum(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function fmt(n: number): string {
  return n.toFixed(2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductCosting({
  productId,
  initial,
  availableItems,
  availableOverheads,
  isAdmin,
}: ProductCostingProps) {
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Materials state ──────────────────────────────────────────────────────
  const [materials, setMaterials] = useState<MaterialRow[]>(initial.materials);
  const [addItemId, setAddItemId] = useState<string>("");
  const [addQty, setAddQty] = useState<string>("");
  const [addItemError, setAddItemError] = useState<string | null>(null);

  // ── Labor state ──────────────────────────────────────────────────────────
  const [laborRate, setLaborRate] = useState<string>(
    initial.laborRatePerHour !== null ? String(initial.laborRatePerHour) : ""
  );
  const [laborTime, setLaborTime] = useState<string>(
    initial.laborTimeMinutes !== null ? String(initial.laborTimeMinutes) : ""
  );

  // ── Overhead state ────────────────────────────────────────────────────────
  const [overheadIds, setOverheadIds] = useState<string[]>(initial.overheadIds);
  const [addOverheadId, setAddOverheadId] = useState<string>("");
  const [generalExpensesPercent, setGeneralExpensesPercent] = useState<string>(
    String(initial.generalExpensesPercent)
  );

  // ── Summary / pricing state ───────────────────────────────────────────────
  const [outputPieces, setOutputPieces] = useState<string>(
    String(initial.outputPieces)
  );
  const [taxEnabled, setTaxEnabled] = useState<boolean>(initial.taxEnabled);
  const [markupPercent, setMarkupPercent] = useState<string>(
    String(initial.markupPercent)
  );
  const [discountPercent, setDiscountPercent] = useState<string>(
    String(initial.discountPercent)
  );
  const [finalRetailPrice, setFinalRetailPrice] = useState<string>(
    initial.finalRetailPrice !== null ? String(initial.finalRetailPrice) : ""
  );

  // ── Derived calculations ──────────────────────────────────────────────────
  const calculations = useMemo(() => {
    const materialCostBatch = materials.reduce(
      (sum, m) => sum + m.quantity * m.item.cost,
      0
    );

    const rate = toNum(laborRate);
    const time = toNum(laborTime);
    const laborCostBatch = rate > 0 && time > 0 ? (rate / 60) * time : 0;

    const selectedOverheads = overheadIds
      .map((id) => availableOverheads.find((o) => o.id === id))
      .filter((o): o is AvailableOverhead => !!o);
    const overheadItemsCost = selectedOverheads.reduce(
      (sum, o) => sum + o.costPerUse,
      0
    );

    const generalPct = toNum(generalExpensesPercent);
    const generalExpenses =
      (generalPct / 100) * (materialCostBatch + laborCostBatch + overheadItemsCost);
    const totalOverheadBatch = overheadItemsCost + generalExpenses;

    const totalBatchCost = materialCostBatch + laborCostBatch + totalOverheadBatch;
    const tax = taxEnabled ? totalBatchCost * 0.12 : 0;
    const totalWithTax = totalBatchCost + tax;

    const pieces = Math.max(1, Math.floor(toNum(outputPieces)) || 1);
    const perPieceCost = totalWithTax / pieces;

    const markup = toNum(markupPercent);
    const discount = toNum(discountPercent);
    const suggestedRetailPrice = perPieceCost * (1 + markup / 100);
    const discountedPrice = suggestedRetailPrice * (1 - discount / 100);

    const frp = toNum(finalRetailPrice);
    const grossIncome = frp > 0 ? frp - perPieceCost : null;
    const grossMargin =
      grossIncome !== null && frp > 0 ? (grossIncome / frp) * 100 : null;

    return {
      materialCostBatch,
      laborCostBatch,
      overheadItemsCost,
      generalExpenses,
      totalOverheadBatch,
      totalBatchCost,
      tax,
      totalWithTax,
      perPieceCost,
      suggestedRetailPrice,
      discountedPrice,
      grossIncome,
      grossMargin,
      selectedOverheads,
    };
  }, [
    materials,
    laborRate,
    laborTime,
    overheadIds,
    availableOverheads,
    generalExpensesPercent,
    taxEnabled,
    outputPieces,
    markupPercent,
    discountPercent,
    finalRetailPrice,
  ]);

  // ── Materials helpers ─────────────────────────────────────────────────────
  const addedItemIds = new Set(materials.map((m) => m.itemId));
  const itemsNotAdded = availableItems.filter((i) => !addedItemIds.has(i.id));

  function handleAddMaterial() {
    setAddItemError(null);
    if (!addItemId) {
      setAddItemError("Select an item.");
      return;
    }
    const qty = parseFloat(addQty);
    if (isNaN(qty) || qty <= 0) {
      setAddItemError("Quantity must be greater than zero.");
      return;
    }
    const item = availableItems.find((i) => i.id === addItemId);
    if (!item) return;
    setMaterials((prev) => [...prev, { itemId: addItemId, quantity: qty, item }]);
    setAddItemId("");
    setAddQty("");
  }

  function handleRemoveMaterial(itemId: string) {
    setMaterials((prev) => prev.filter((m) => m.itemId !== itemId));
  }

  function handleMaterialQtyChange(itemId: string, val: string) {
    const qty = parseFloat(val);
    if (isNaN(qty) || qty <= 0) return;
    setMaterials((prev) =>
      prev.map((m) => (m.itemId === itemId ? { ...m, quantity: qty } : m))
    );
  }

  // ── Overhead helpers ──────────────────────────────────────────────────────
  function handleAddOverhead() {
    if (!addOverheadId || overheadIds.includes(addOverheadId)) return;
    setOverheadIds((prev) => [...prev, addOverheadId]);
    setAddOverheadId("");
  }

  function handleRemoveOverhead(id: string) {
    setOverheadIds((prev) => prev.filter((oid) => oid !== id));
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);

    const pieces = Math.floor(toNum(outputPieces));
    if (pieces < 1) {
      setSaveError("Output pieces must be at least 1.");
      return;
    }

    startTransition(async () => {
      const res = await saveCostingAction(productId, {
        laborRatePerHour: laborRate !== "" ? parseFloat(laborRate) : null,
        laborTimeMinutes: laborTime !== "" ? parseFloat(laborTime) : null,
        generalExpensesPercent: toNum(generalExpensesPercent),
        outputPieces: pieces,
        taxEnabled,
        markupPercent: toNum(markupPercent),
        discountPercent: toNum(discountPercent),
        finalRetailPrice: finalRetailPrice !== "" ? parseFloat(finalRetailPrice) : null,
        materials: materials.map((m) => ({ itemId: m.itemId, quantity: m.quantity })),
        overheadIds,
      });

      if ("error" in res) {
        setSaveError(res.error);
      } else {
        setSaveSuccess(true);
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 pb-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border-t border-border pt-6">
          <h3 className="text-base font-semibold tracking-tight mb-4">
            Product Costing
          </h3>

          {/* ── Materials ─────────────────────────────────────────── */}
          <section className="space-y-3">
            <h4 className="text-sm font-medium">Materials</h4>

            {materials.length > 0 && (
              <div className="space-y-2">
                {materials.map((m) => (
                  <div
                    key={m.itemId}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <span className="flex-1 text-sm font-medium truncate">
                      {m.item.name}
                    </span>
                    <Input
                      type="number"
                      min={0.001}
                      step="any"
                      defaultValue={m.quantity}
                      onBlur={(e) =>
                        handleMaterialQtyChange(m.itemId, e.target.value)
                      }
                      className="w-20 h-7 text-sm text-right"
                    />
                    <span className="text-xs text-muted-foreground w-10 shrink-0">
                      {m.item.unit}
                    </span>
                    <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                      ₱{fmt(m.quantity * m.item.cost)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleRemoveMaterial(m.itemId)}
                      aria-label="Remove material"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-right pr-10">
                  Subtotal:{" "}
                  <span className="font-medium text-foreground">
                    ₱{fmt(calculations.materialCostBatch)}
                  </span>
                </p>
              </div>
            )}

            {itemsNotAdded.length > 0 && (
              <div className="space-y-2">
                {addItemError && (
                  <p className="text-xs text-destructive">{addItemError}</p>
                )}
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Add item
                    </Label>
                    <Select
                      value={addItemId || "__none__"}
                      onValueChange={(v) =>
                        setAddItemId(v === "__none__" ? "" : (v ?? ""))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {addItemId
                            ? (availableItems.find((i) => i.id === addItemId)
                                ?.name ?? "Select item")
                            : "Select item"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" disabled label="Select item" />
                        {itemsNotAdded.map((item) => (
                          <SelectItem key={item.id} value={item.id} label={item.name}>
                            <span className="text-muted-foreground text-xs">
                              {item.unit} · ₱{fmt(item.cost)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min={0.001}
                      step="any"
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  {addItemId && (
                    <span className="text-xs text-muted-foreground pb-2 shrink-0">
                      {availableItems.find((i) => i.id === addItemId)?.unit}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={handleAddMaterial}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </div>
            )}

            {availableItems.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No inventory items available.
              </p>
            )}
          </section>

          {/* ── Labor ─────────────────────────────────────────────── */}
          <section className="space-y-3 mt-6">
            <h4 className="text-sm font-medium">Labor</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="labor-rate">Labor rate (₱/hr)</Label>
                <Input
                  id="labor-rate"
                  type="number"
                  min={0}
                  step="any"
                  value={laborRate}
                  onChange={(e) => setLaborRate(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="labor-time">Time to make (min)</Label>
                <Input
                  id="labor-time"
                  type="number"
                  min={0}
                  step="any"
                  value={laborTime}
                  onChange={(e) => setLaborTime(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            {(toNum(laborRate) > 0 || toNum(laborTime) > 0) && (
              <p className="text-xs text-muted-foreground">
                Labor cost (batch):{" "}
                <span className="font-medium text-foreground">
                  ₱{fmt(calculations.laborCostBatch)}
                </span>
              </p>
            )}
          </section>

          {/* ── Overhead ──────────────────────────────────────────── */}
          <section className="space-y-3 mt-6">
            <h4 className="text-sm font-medium">Overhead</h4>

            {calculations.selectedOverheads.length > 0 && (
              <div className="space-y-2">
                {calculations.selectedOverheads.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <span className="flex-1 text-sm font-medium truncate">
                      {o.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ₱{fmt(o.costPerUse)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleRemoveOverhead(o.id)}
                      aria-label="Remove overhead"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {availableOverheads.filter((o) => !overheadIds.includes(o.id))
              .length > 0 && (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Add overhead
                  </Label>
                  <Select
                    value={addOverheadId || "__none__"}
                    onValueChange={(v) =>
                      setAddOverheadId(v === "__none__" ? "" : (v ?? ""))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {addOverheadId
                          ? (availableOverheads.find((o) => o.id === addOverheadId)
                              ?.name ?? "Select overhead")
                          : "Select overhead"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" disabled label="Select overhead" />
                      {availableOverheads
                        .filter((o) => !overheadIds.includes(o.id))
                        .map((o) => (
                          <SelectItem key={o.id} value={o.id} label={o.name}>
                            <span className="text-muted-foreground text-xs">
                              ₱{fmt(o.costPerUse)}/use
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={handleAddOverhead}
                  disabled={!addOverheadId}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            )}

            {availableOverheads.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No overhead items available.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="general-exp">General expenses (%)</Label>
                <Input
                  id="general-exp"
                  type="number"
                  min={0}
                  step="any"
                  value={generalExpensesPercent}
                  onChange={(e) => setGeneralExpensesPercent(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex items-end pb-0.5">
                <p className="text-xs text-muted-foreground">
                  General expenses:{" "}
                  <span className="font-medium text-foreground">
                    ₱{fmt(calculations.generalExpenses)}
                  </span>
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Total overhead (batch):{" "}
              <span className="font-medium text-foreground">
                ₱{fmt(calculations.totalOverheadBatch)}
              </span>
            </p>
          </section>

          {/* ── Summary ───────────────────────────────────────────── */}
          <section className="space-y-3 mt-6">
            <h4 className="text-sm font-medium">Product Cost Summary</h4>

            <div className="space-y-1.5">
              <Label htmlFor="output-pieces">Batch output (pieces)</Label>
              <Input
                id="output-pieces"
                type="number"
                min={1}
                step={1}
                value={outputPieces}
                onChange={(e) => setOutputPieces(e.target.value)}
                placeholder="1"
                className="w-32"
              />
            </div>

            <div className="rounded-lg border border-border px-4 py-4 space-y-2">
              <CostRow
                label="Material cost / piece"
                value={`₱${fmt(calculations.materialCostBatch / Math.max(1, Math.floor(toNum(outputPieces)) || 1))}`}
              />
              <CostRow
                label="Labor cost / piece"
                value={`₱${fmt(calculations.laborCostBatch / Math.max(1, Math.floor(toNum(outputPieces)) || 1))}`}
              />
              <CostRow
                label="Overhead cost / piece"
                value={`₱${fmt(calculations.totalOverheadBatch / Math.max(1, Math.floor(toNum(outputPieces)) || 1))}`}
              />
              <div className="border-t border-border pt-2">
                <CostRow
                  label="Product Cost / piece"
                  value={`₱${fmt(calculations.totalBatchCost / Math.max(1, Math.floor(toNum(outputPieces)) || 1))}`}
                  bold
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-foreground"
                  />
                  <span className="text-sm">Include 12% VAT</span>
                </label>
                {taxEnabled && (
                  <span className="text-xs text-muted-foreground">
                    +₱{fmt(calculations.tax / Math.max(1, Math.floor(toNum(outputPieces)) || 1))}
                  </span>
                )}
              </div>

              <div className="border-t border-border pt-2">
                <CostRow
                  label="Total Product Cost / piece"
                  value={`₱${fmt(calculations.perPieceCost)}`}
                  bold
                  highlight
                />
              </div>
            </div>
          </section>

          {/* ── Pricing ───────────────────────────────────────────── */}
          <section className="space-y-3 mt-6">
            <h4 className="text-sm font-medium">Pricing</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="markup-pct">Markup (%)</Label>
                <Input
                  id="markup-pct"
                  type="number"
                  min={0}
                  step="any"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col justify-end gap-1 pb-0.5">
                <p className="text-xs text-muted-foreground">
                  Suggested retail price
                </p>
                <p className="text-sm font-medium">
                  ₱{fmt(calculations.suggestedRetailPrice)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="discount-pct">Discount (%)</Label>
                <Input
                  id="discount-pct"
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col justify-end gap-1 pb-0.5">
                <p className="text-xs text-muted-foreground">
                  Discounted retail price
                </p>
                <p className="text-sm font-medium">
                  ₱{fmt(calculations.discountedPrice)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="final-price">Final retail price (₱)</Label>
              <Input
                id="final-price"
                type="number"
                min={0}
                step="any"
                value={finalRetailPrice}
                onChange={(e) => setFinalRetailPrice(e.target.value)}
                placeholder="Override with manual price"
                className="w-48"
              />
            </div>
          </section>

          {/* ── Income Summary ────────────────────────────────────── */}
          {finalRetailPrice !== "" && toNum(finalRetailPrice) > 0 && (
            <section className="mt-6">
              <h4 className="text-sm font-medium mb-3">Income Computation</h4>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Per-piece income</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Final retail price</span>
                    <span className="font-medium">₱{fmt(toNum(finalRetailPrice))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total product cost / piece</span>
                    <span className="font-medium">₱{fmt(calculations.perPieceCost)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm">
                    <span className="font-medium">Gross income</span>
                    <span
                      className={
                        (calculations.grossIncome ?? 0) >= 0
                          ? "font-semibold text-green-600"
                          : "font-semibold text-destructive"
                      }
                    >
                      ₱{fmt(calculations.grossIncome ?? 0)}
                    </span>
                  </div>
                  {calculations.grossMargin !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross margin</span>
                      <span
                        className={
                          calculations.grossMargin >= 0
                            ? "font-semibold text-green-600"
                            : "font-semibold text-destructive"
                        }
                      >
                        {calculations.grossMargin.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── Save button ────────────────────────────────────────── */}
          {isAdmin && (
            <div className="mt-6 space-y-2">
              {saveError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                  Costing saved successfully.
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending ? "Saving…" : "Save costing"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper sub-component ─────────────────────────────────────────────────────

function CostRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={bold ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span
        className={
          highlight
            ? "font-semibold"
            : bold
            ? "font-medium"
            : "text-muted-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
