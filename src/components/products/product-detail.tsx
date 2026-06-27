"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product, ProductionRun } from "@/generated/prisma/client";
import {
  updateProductAction,
  deleteProductAction,
  adjustStockAction,
} from "@/app/(app)/products/actions";
import { RecordProductionDialog } from "@/components/products/record-production-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ChevronRight, Pencil, Trash2, Plus, Factory } from "lucide-react";

interface ProductDetailProps {
  product: Product;
  role: string;
  productionRuns: ProductionRun[];
}

export function ProductDetail({ product, role, productionRuns }: ProductDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const isAdmin = role === "ADMIN";

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: product.name,
    stockQuantity: String(product.stockQuantity),
  });

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Stock adjustment state
  const [adjusting, setAdjusting] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Record Production state
  const [productionOpen, setProductionOpen] = useState(false);

  function startEdit() {
    setEditForm({
      name: product.name,
      stockQuantity: String(product.stockQuantity),
    });
    setEditError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditError(null);
  }

  function handleSave() {
    setEditError(null);
    const qty = parseFloat(editForm.stockQuantity);
    if (isNaN(qty) || qty < 0) {
      setEditError("Stock quantity must be zero or greater.");
      return;
    }
    startTransition(async () => {
      const res = await updateProductAction(product.id, {
        name: editForm.name,
        stockQuantity: qty,
      });
      if (res.error) {
        setEditError(res.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteProductAction(product.id);
      router.push("/products");
    });
  }

  function openAdjust() {
    setAdjustDelta("");
    setAdjustError(null);
    setAdjusting(true);
  }

  function cancelAdjust() {
    setAdjusting(false);
    setAdjustError(null);
  }

  function handleAdjust() {
    setAdjustError(null);
    const delta = parseFloat(adjustDelta);
    if (isNaN(delta) || delta === 0) {
      setAdjustError("Enter a non-zero amount.");
      return;
    }
    startTransition(async () => {
      const res = await adjustStockAction(product.id, delta);
      if (res.error) {
        setAdjustError(res.error);
      } else {
        setAdjusting(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-foreground transition-colors">
            Products
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </nav>

        {editing ? (
          /* ── Inline edit form ─────────────────────────────────── */
          <div className="space-y-4">
            {editError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="pd-name">Name *</Label>
              <Input
                id="pd-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pd-stock">Stock quantity</Label>
              <Input
                id="pd-stock"
                type="number"
                min={0}
                step="any"
                value={editForm.stockQuantity}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, stockQuantity: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEdit} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!editForm.name.trim()}
                className="flex-1"
              >
                Save changes
              </Button>
            </div>
          </div>
        ) : (
          /* ── Detail view ──────────────────────────────────────── */
          <>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-tight">{product.name}</h2>
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                    <Button size="sm" className="gap-1.5" onClick={startEdit}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Stock:{" "}
                <span className="font-medium text-foreground">
                  {product.stockQuantity}
                </span>{" "}
                unit{product.stockQuantity !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Stock adjustment section */}
            {isAdmin && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Stock adjustment</h3>
                  {!adjusting && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={openAdjust}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add stock
                    </Button>
                  )}
                </div>

                {adjusting && (
                  <div className="rounded-lg border border-border px-4 py-4 space-y-4">
                    {adjustError && (
                      <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {adjustError}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="adj-delta">
                        Amount to add (use negative to remove)
                      </Label>
                      <Input
                        id="adj-delta"
                        type="number"
                        step="any"
                        value={adjustDelta}
                        onChange={(e) => setAdjustDelta(e.target.value)}
                        placeholder="e.g. 10 or -3"
                        autoFocus
                      />
                    </div>
                    {adjustDelta && !isNaN(parseFloat(adjustDelta)) && (
                      <p className="text-xs text-muted-foreground">
                        New stock:{" "}
                        <span className="font-medium text-foreground">
                          {Math.max(0, product.stockQuantity + parseFloat(adjustDelta))}
                        </span>
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={cancelAdjust}>
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleAdjust}
                        disabled={!adjustDelta || isNaN(parseFloat(adjustDelta)) || parseFloat(adjustDelta) === 0}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Record Production section ──────────────────────── */}
            {isAdmin && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Production</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setProductionOpen(true)}
                  >
                    <Factory className="h-3.5 w-3.5" />
                    Record production
                  </Button>
                </div>

                {/* Production history */}
                {productionRuns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No production runs recorded yet.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border divide-y divide-border">
                    {productionRuns.map((run) => (
                      <div key={run.id} className="px-4 py-3 flex items-start justify-between gap-4">
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-sm font-medium">
                            {run.piecesProduced} piece{run.piecesProduced !== 1 ? "s" : ""} produced
                          </p>
                          {run.notes && (
                            <p className="text-xs text-muted-foreground truncate">{run.notes}</p>
                          )}
                        </div>
                        <time className="text-xs text-muted-foreground shrink-0">
                          {new Date(run.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{product.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Production dialog */}
      {isAdmin && (
        <RecordProductionDialog
          productId={product.id}
          productName={product.name}
          open={productionOpen}
          onOpenChange={setProductionOpen}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
