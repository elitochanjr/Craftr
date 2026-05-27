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

interface ProjectsViewProps {
  projects: Project[];
}

export function ProjectsView({ projects }: ProjectsViewProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectInput>(EMPTY);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY);
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(p: Project) {
    setEditTarget(p);
    setForm({
      name: p.name,
      status: p.status,
      startDate: toDateInput(p.startDate),
      endDate: p.endDate ? toDateInput(p.endDate) : "",
      notes: p.notes ?? "",
    });
    setError(null);
    setSheetOpen(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = editTarget
        ? await updateProjectAction(editTarget.id, form)
        : await createProjectAction(form);
      if (res.error) setError(res.error);
      else setSheetOpen(false);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteProjectAction(deleteTarget.id);
      setDeleteTarget(null);
    });
  }

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
                className="flex items-start justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
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
                  </p>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {p.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editTarget ? "Edit project" : "New project"}
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
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Summer journal collection"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as ProjectStatus }))
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
              onClick={() => setSheetOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex-1"
            >
              {editTarget ? "Save changes" : "Create project"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete dialog */}
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
