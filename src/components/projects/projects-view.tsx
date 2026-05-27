"use client";

import { useState, useTransition } from "react";
import type { Project, ProjectStatus } from "@/generated/prisma/client";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  type ProjectInput,
} from "@/app/(app)/projects/actions";
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
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { UsageList } from "@/components/inventory/usage-list";
import { LogUsageForm } from "@/components/inventory/log-usage-form";

function toDateInput(d: Date | string) {
  return new Date(d).toISOString().split("T")[0];
}

const EMPTY: ProjectInput = {
  name: "",
  status: "IN_PROGRESS",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  notes: "",
};

type ProjectRow = Project & { totalSupplyCost: number; stockMovements: undefined };

type ItemOption = {
  id: string;
  name: string;
  unit: string;
  cost: number;
  quantity: number;
};

interface ProjectsViewProps {
  projects: ProjectRow[];
  items: ItemOption[];
}

export function ProjectsView({ projects, items }: ProjectsViewProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  type Mode = null | "view" | "edit" | "create";
  const [mode, setMode] = useState<Mode>(null);
  const [selected, setSelected] = useState<ProjectRow | null>(null);
  const [form, setForm] = useState<ProjectInput>(EMPTY);

  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null);
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const [liveSupplyCost, setLiveSupplyCost] = useState<number | null>(null);

  function openCreate() {
    setSelected(null);
    setForm(EMPTY);
    setError(null);
    setMode("create");
  }

  function openView(p: ProjectRow) {
    setSelected(p);
    setError(null);
    setLiveSupplyCost(null);
    setMode("view");
  }

  function openEdit(p: ProjectRow) {
    setSelected(p);
    setForm({
      name: p.name,
      status: p.status,
      startDate: toDateInput(p.startDate),
      endDate: p.endDate ? toDateInput(p.endDate) : "",
      notes: p.notes ?? "",
    });
    setError(null);
    setMode("edit");
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res =
        mode === "edit" && selected
          ? await updateProjectAction(selected.id, form)
          : await createProjectAction(form);
      if (res.error) setError(res.error);
      else setMode(null);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteProjectAction(deleteTarget.id);
      setDeleteTarget(null);
      setMode(null);
    });
  }

  const supplyCost =
    liveSupplyCost !== null ? liveSupplyCost : selected?.totalSupplyCost ?? 0;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
            <p className="text-sm text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No projects yet</p>
            <p className="text-xs text-muted-foreground">
              Track your hobby projects and the supplies they use.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => openView(p)}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <Badge
                      variant={
                        p.status === "COMPLETED" ? "secondary" : "default"
                      }
                      className="shrink-0"
                    >
                      {p.status === "IN_PROGRESS" ? "In progress" : "Completed"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Started {new Date(p.startDate).toLocaleDateString()}
                    {p.endDate &&
                      ` · Ended ${new Date(p.endDate).toLocaleDateString()}`}
                    {p.totalSupplyCost > 0 &&
                      ` · $${p.totalSupplyCost.toFixed(2)} supplies`}
                  </p>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {p.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sheet ─────────────────────────────────────────────────────── */}
      <Sheet
        open={mode !== null}
        onOpenChange={(open) => !open && setMode(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto"
        >
          {mode === "view" && selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6">{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selected.status === "COMPLETED" ? "secondary" : "default"
                    }
                  >
                    {selected.status === "IN_PROGRESS"
                      ? "In progress"
                      : "Completed"}
                  </Badge>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Start date
                    </dt>
                    <dd className="font-medium">
                      {new Date(selected.startDate).toLocaleDateString()}
                    </dd>
                  </div>
                  {selected.endDate && (
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        End date
                      </dt>
                      <dd className="font-medium">
                        {new Date(selected.endDate).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Supply cost
                    </dt>
                    <dd className="font-medium">${supplyCost.toFixed(2)}</dd>
                  </div>
                </dl>

                {selected.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {selected.notes}
                    </p>
                  </div>
                )}

                {/* Log supply usage */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 w-full"
                  onClick={() => setUsageOpen(true)}
                >
                  Log supply usage
                </Button>

                <UsageList
                  projectId={selected.id}
                  refreshKey={usageRefreshKey}
                  onTotalCostChange={setLiveSupplyCost}
                />
              </div>

              <SheetFooter className="gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive gap-1.5"
                  onClick={() => setDeleteTarget(selected)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={() => openEdit(selected)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </SheetFooter>
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle>
                  {mode === "edit" ? "Edit project" : "New project"}
                </SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4 space-y-4 flex-1">
                {error && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Name *</Label>
                  <Input
                    id="p-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Summer journal collection"
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-start">Start date</Label>
                    <Input
                      id="p-start"
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, startDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-end">End date</Label>
                    <Input
                      id="p-end"
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, endDate: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-notes">Notes</Label>
                  <Textarea
                    id="p-notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="Materials needed, inspiration, etc."
                    rows={3}
                  />
                </div>
              </div>
              <SheetFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    mode === "edit" && selected
                      ? setMode("view")
                      : setMode(null)
                  }
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!form.name.trim()}
                  className="flex-1"
                >
                  {mode === "edit" ? "Save changes" : "Create project"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Delete dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.name}</strong>? Supply usage records
            linked to this project will be unlinked. This cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Log usage sheet ───────────────────────────────────────────── */}
      {selected && (
        <LogUsageForm
          open={usageOpen}
          onOpenChange={setUsageOpen}
          contextLabel={selected.name}
          projectId={selected.id}
          items={items}
          onSuccess={() => setUsageRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
