"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project, ProjectStatus } from "@/generated/prisma/client";
import {
  updateProjectAction,
  deleteProjectAction,
  type ProjectInput,
} from "@/app/(app)/projects/actions";
import { logUsageAction } from "@/app/(app)/inventory/movement-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { UsageList } from "@/components/inventory/usage-list";

type ProjectRow = Omit<Project, "stockMovements"> & {
  totalSupplyCost: number;
  stockMovements: undefined;
};

type ItemOption = {
  id: string;
  name: string;
  unit: string;
  cost: number;
  quantity: number;
};

interface ProjectDetailProps {
  project: ProjectRow;
  items: ItemOption[];
}

function toDateInput(d: Date | string) {
  return new Date(d).toISOString().split("T")[0];
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export function ProjectDetail({ project, items }: ProjectDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectInput>({
    name: project.name,
    status: project.status,
    startDate: toDateInput(project.startDate),
    endDate: project.endDate ? toDateInput(project.endDate) : "",
    notes: project.notes ?? "",
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loggingUsage, setLoggingUsage] = useState(false);
  const [usageForm, setUsageForm] = useState({ itemId: "", quantity: "", unitCost: "" });
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const [liveSupplyCost, setLiveSupplyCost] = useState<number | null>(null);

  function openUsageForm() {
    setUsageForm({ itemId: "", quantity: "", unitCost: "" });
    setUsageError(null);
    setLoggingUsage(true);
  }

  function cancelUsageForm() {
    setLoggingUsage(false);
    setUsageError(null);
  }

  function handleUsageItemChange(id: string) {
    const item = items.find((i) => i.id === id);
    setUsageForm((f) => ({ ...f, itemId: id, unitCost: item ? String(item.cost) : "" }));
  }

  function handleLogUsage() {
    setUsageError(null);
    const qty = parseFloat(usageForm.quantity);
    const cost = parseFloat(usageForm.unitCost);
    if (!usageForm.itemId) { setUsageError("Select an item."); return; }
    if (isNaN(qty) || qty <= 0) { setUsageError("Quantity must be greater than zero."); return; }
    if (isNaN(cost) || cost < 0) { setUsageError("Unit cost cannot be negative."); return; }
    startTransition(async () => {
      const res = await logUsageAction({ itemId: usageForm.itemId, quantity: qty, unitCost: cost, projectId: project.id });
      if (res.error) {
        setUsageError(res.error);
      } else {
        setLoggingUsage(false);
        setUsageForm({ itemId: "", quantity: "", unitCost: "" });
        setUsageRefreshKey((k) => k + 1);
      }
    });
  }

  const supplyCost = liveSupplyCost !== null ? liveSupplyCost : project.totalSupplyCost;

  function startEdit() {
    setForm({
      name: project.name,
      status: project.status,
      startDate: toDateInput(project.startDate),
      endDate: project.endDate ? toDateInput(project.endDate) : "",
      notes: project.notes ?? "",
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
    startTransition(async () => {
      const res = await updateProjectAction(project.id, form);
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
      await deleteProjectAction(project.id);
      router.push("/projects");
    });
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate">{project.name}</span>
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
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: (v ?? "IN_PROGRESS") as ProjectStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {STATUS_LABEL[form.status] ?? form.status}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pd-start">Start date</Label>
                <Input
                  id="pd-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pd-end">End date</Label>
                <Input
                  id="pd-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pd-notes">Notes</Label>
              <Textarea
                id="pd-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEdit} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="flex-1"
              >
                Save changes
              </Button>
            </div>
          </div>
        ) : (
          /* ── Detail view ──────────────────────────────────────── */
          <>
            {/* Hero */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-tight">{project.name}</h2>
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
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge variant={project.status === "COMPLETED" ? "secondary" : "default"}>
                  {STATUS_LABEL[project.status]}
                </Badge>
                <span className="text-muted-foreground">
                  Started {new Date(project.startDate).toLocaleDateString()}
                </span>
                {project.endDate && (
                  <span className="text-muted-foreground">
                    · Ended {new Date(project.endDate).toLocaleDateString()}
                  </span>
                )}
                <span className="text-muted-foreground">
                  · <span className="font-medium text-foreground">${supplyCost.toFixed(2)}</span> in supplies
                </span>
              </div>
            </div>

            {/* Notes */}
            {project.notes && (
              <div className="rounded-lg border border-border px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
              </div>
            )}
          </>
        )}

        {/* Supply usage section — always visible */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Supply usage</h3>
            {!loggingUsage && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={openUsageForm}>
                Log supply usage
              </Button>
            )}
          </div>

          {loggingUsage && (
            <div className="rounded-lg border border-border px-4 py-4 space-y-4">
              {usageError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {usageError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Item *</Label>
                <Select
                  value={usageForm.itemId || "__none__"}
                  onValueChange={(v) => handleUsageItemChange(v === "__none__" ? "" : (v ?? ""))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {usageForm.itemId
                        ? (items.find((i) => i.id === usageForm.itemId)?.name ?? "Select item")
                        : "Select item"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" disabled label="Select item" />
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id} label={item.name}>
                        <span className="text-muted-foreground text-xs ml-auto shrink-0">
                          {item.quantity} {item.unit}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lu-qty">Quantity used *</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id="lu-qty"
                      type="number"
                      min={0.001}
                      step="any"
                      value={usageForm.quantity}
                      onChange={(e) => setUsageForm((f) => ({ ...f, quantity: e.target.value }))}
                      placeholder="0"
                    />
                    {usageForm.itemId && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {items.find((i) => i.id === usageForm.itemId)?.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lu-cost">Unit cost ($)</Label>
                  <Input
                    id="lu-cost"
                    type="number"
                    value={usageForm.unitCost}
                    readOnly
                    placeholder="—"
                    className="bg-muted text-muted-foreground"
                  />
                </div>
              </div>
              {usageForm.quantity && usageForm.unitCost && (
                <p className="text-xs text-muted-foreground">
                  Total cost:{" "}
                  <span className="font-medium text-foreground">
                    ${(parseFloat(usageForm.quantity) * parseFloat(usageForm.unitCost)).toFixed(2)}
                  </span>
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={cancelUsageForm}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleLogUsage}
                  disabled={!usageForm.itemId || !usageForm.quantity}
                >
                  Log usage
                </Button>
              </div>
            </div>
          )}

          <UsageList
            projectId={project.id}
            refreshKey={usageRefreshKey}
            onTotalCostChange={setLiveSupplyCost}
          />
        </div>
      </div>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{project.name}</strong>? Supply usage records linked to
            this project will be unlinked. This cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
