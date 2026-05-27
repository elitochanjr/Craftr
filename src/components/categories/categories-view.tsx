"use client";

import { useState, useTransition } from "react";
import type { Category } from "@/generated/prisma/client";
import {
  createCategoryAction,
  renameCategoryAction,
  deleteCategoryAction,
} from "@/app/(app)/categories/actions";
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
import { Pencil, Trash2, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoriesViewProps {
  categories: Category[];
}

export function CategoriesView({ categories }: CategoriesViewProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  // Rename dialog
  const [renameTarget, setRenameTarget] = useState<Category | null>(null);
  const [renameName, setRenameName] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const res = await createCategoryAction(createName);
      if (res.error) {
        setError(res.error);
      } else {
        setCreateOpen(false);
        setCreateName("");
      }
    });
  }

  function handleRename() {
    if (!renameTarget) return;
    setError(null);
    startTransition(async () => {
      const res = await renameCategoryAction(renameTarget.id, renameName);
      if (res.error) {
        setError(res.error);
      } else {
        setRenameTarget(null);
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteCategoryAction(deleteTarget.id);
      if (res.error) {
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
            <h2 className="text-xl font-semibold tracking-tight">Categories</h2>
            <p className="text-sm text-muted-foreground">
              {categories.length} categor{categories.length === 1 ? "y" : "ies"}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setError(null);
              setCreateName("");
              setCreateOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Category list */}
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No categories yet</p>
            <p className="text-xs text-muted-foreground">
              Add your first category to organize inventory items.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={cn(
                  "flex items-center justify-between px-4 py-3",
                  "hover:bg-muted/50 transition-colors"
                )}
              >
                <span className="text-sm font-medium">{cat.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setError(null);
                      setRenameTarget(cat);
                      setRenameName(cat.name);
                    }}
                    aria-label={`Rename ${cat.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setError(null);
                      setDeleteTarget(cat);
                    }}
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 px-0">
            <Label htmlFor="create-name">Name</Label>
            <Input
              id="create-name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Paper, Ink, Tools"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleCreate} disabled={!createName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename category</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-name">Name</Label>
            <Input
              id="rename-name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleRename} disabled={!renameName.trim()}>
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
            <DialogTitle>Delete category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            Items using this category must be reassigned first.
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
