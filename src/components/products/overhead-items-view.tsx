"use client";

import { useState, useTransition } from "react";
import type { OverheadItem } from "@/generated/prisma/client";
import {
  createOverheadItemAction,
  updateOverheadItemAction,
  deleteOverheadItemAction,
} from "@/app/(app)/products/overhead-actions";
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
import { Pencil, Trash2, Plus, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverheadItemsViewProps {
  items: OverheadItem[];
  role: string;
}

export function OverheadItemsView({ items, role }: OverheadItemsViewProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isAdmin = role === "ADMIN";

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCost, setCreateCost] = useState("");

  // Edit dialog
  const [editTarget, setEditTarget] = useState<OverheadItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCost, setEditCost] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<OverheadItem | null>(null);

  function openCreate() {
    setError(null);
    setCreateName("");
    setCreateCost("");
    setCreateOpen(true);
  }

  function openEdit(item: OverheadItem) {
    setError(null);
    setEditTarget(item);
    setEditName(item.name);
    setEditCost(String(item.costPerUse));
  }

  function handleCreate() {
    setError(null);
    const cost = parseFloat(createCost);
    if (isNaN(cost) || cost < 0) {
      setError("Cost per use must be a valid non-negative number.");
      return;
    }
    startTransition(async () => {
      const res = await createOverheadItemAction({
        name: createName,
        costPerUse: cost,
      });
      if ("error" in res) {
        setError(res.error);
      } else {
        setCreateOpen(false);
        setCreateName("");
        setCreateCost("");
      }
    });
  }

  function handleEdit() {
    if (!editTarget) return;
    setError(null);
    const cost = parseFloat(editCost);
    if (isNaN(cost) || cost < 0) {
      setError("Cost per use must be a valid non-negative number.");
      return;
    }
    startTransition(async () => {
      const res = await updateOverheadItemAction(editTarget.id, {
        name: editName,
        costPerUse: cost,
      });
      if ("error" in res) {
        setError(res.error);
      } else {
        setEditTarget(null);
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteOverheadItemAction(deleteTarget.id);
      if ("error" in res) {
        setError(res.error);
        setDeleteTarget(null);
      } else {
        setDeleteTarget(null);
      }
    });
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Overhead Items
            </h2>
            <p className="text-sm text-muted-foreground">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add overhead item
            </Button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No overhead items yet</p>
            <p className="text-xs text-muted-foreground">
              Add equipment and tools with a fixed cost per use.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {/* Table header */}
            <div className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
              <span className="flex-1">Name</span>
              <span className="w-28 text-right">Cost per use</span>
              {isAdmin && <span className="w-16" />}
            </div>
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center px-4 py-3",
                  "hover:bg-muted/50 transition-colors"
                )}
              >
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                <span className="w-28 text-right text-sm text-muted-foreground">
                  ₱{item.costPerUse.toFixed(2)}
                </span>
                {isAdmin && (
                  <div className="w-16 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(item)}
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setError(null);
                        setDeleteTarget(item);
                      }}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add overhead item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Embossing machine, Heat press"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-cost">Cost per use (₱) *</Label>
              <Input
                id="create-cost"
                type="number"
                min="0"
                step="0.01"
                value={createCost}
                onChange={(e) => setCreateCost(e.target.value)}
                placeholder="0.00"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={!createName.trim() || createCost === ""}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit overhead item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-cost">Cost per use (₱) *</Label>
              <Input
                id="edit-cost"
                type="number"
                min="0"
                step="0.01"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleEdit}
              disabled={!editName.trim() || editCost === ""}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete overhead item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
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
