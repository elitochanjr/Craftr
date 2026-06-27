"use client";

import { useState, useTransition } from "react";
import {
  checkProductionStockAction,
  recordProductionAction,
  type InsufficientStockWarning,
} from "@/app/(app)/products/production-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { AlertTriangle, Factory } from "lucide-react";

interface RecordProductionDialogProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RecordProductionDialog({
  productId,
  productName,
  open,
  onOpenChange,
  onSuccess,
}: RecordProductionDialogProps) {
  const [, startTransition] = useTransition();

  const [piecesProduced, setPiecesProduced] = useState("");
  const [notes, setNotes] = useState("");
  const [warnings, setWarnings] = useState<InsufficientStockWarning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setPiecesProduced("");
    setNotes("");
    setWarnings([]);
    setError(null);
    setChecked(false);
    setSubmitting(false);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  }

  /**
   * Step 1: validate input, check stock warnings.
   */
  function handleCheck() {
    setError(null);
    const pieces = parseFloat(piecesProduced);
    if (isNaN(pieces) || pieces <= 0) {
      setError("Enter a positive number of pieces produced.");
      return;
    }

    startTransition(async () => {
      const result = await checkProductionStockAction(productId, pieces);
      if (result.error) {
        setError(result.error);
        return;
      }
      setWarnings(result.warnings);
      setChecked(true);
    });
  }

  /**
   * Step 2: commit the production run.
   */
  function handleConfirm() {
    const pieces = parseFloat(piecesProduced);
    if (isNaN(pieces) || pieces <= 0) return;

    setSubmitting(true);
    setError(null);

    startTransition(async () => {
      const result = await recordProductionAction({
        productId,
        piecesProduced: pieces,
        notes: notes || undefined,
      });

      setSubmitting(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess();
    });
  }

  const piecesValue = parseFloat(piecesProduced);
  const validPieces = !isNaN(piecesValue) && piecesValue > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            Record production
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            Recording a run for <strong>{productName}</strong>. Materials will
            be deducted from inventory automatically.
          </p>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pr-pieces">Pieces produced *</Label>
            <Input
              id="pr-pieces"
              type="number"
              min={0.001}
              step="any"
              value={piecesProduced}
              onChange={(e) => {
                setPiecesProduced(e.target.value);
                // Reset check state when input changes
                setChecked(false);
                setWarnings([]);
                setError(null);
              }}
              placeholder="e.g. 10"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pr-notes">Notes (optional)</Label>
            <Textarea
              id="pr-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Batch notes, colour variants, etc."
              rows={2}
            />
          </div>

          {/* Insufficient-stock warnings */}
          {checked && warnings.length > 0 && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-3 space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-yellow-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Insufficient stock for {warnings.length} material
                {warnings.length !== 1 ? "s" : ""}
              </div>
              <ul className="space-y-1">
                {warnings.map((w) => (
                  <li key={w.itemId} className="text-xs text-yellow-700">
                    <span className="font-medium">{w.itemName}</span>: need{" "}
                    {w.required.toFixed(2)} {w.unit}, have{" "}
                    {w.available.toFixed(2)} {w.unit} — stock will go negative
                  </li>
                ))}
              </ul>
            </div>
          )}

          {checked && warnings.length === 0 && (
            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              All materials have sufficient stock.
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          {!checked ? (
            <Button onClick={handleCheck} disabled={!validPieces}>
              Check stock
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              variant={warnings.length > 0 ? "destructive" : "default"}
            >
              {submitting
                ? "Recording…"
                : warnings.length > 0
                ? "Record anyway"
                : "Record production"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
