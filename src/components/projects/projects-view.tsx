"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Project, ProjectStatus } from "@/generated/prisma/client";
import {
  createProjectAction,
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
import { Plus, FolderOpen } from "lucide-react";

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

interface ProjectsViewProps {
  projects: ProjectRow[];
}

export function ProjectsView({ projects }: ProjectsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ProjectInput>(EMPTY);

  function openCreate() {
    setForm(EMPTY);
    setError(null);
    setCreateOpen(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await createProjectAction(form);
      if (res.error) {
        setError(res.error);
      } else {
        setCreateOpen(false);
        router.push(`/projects/${res.id}`);
      }
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
                className="flex items-start justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/projects/${p.id}`)}
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

      {/* ── Create sheet ───────────────────────────────────────────── */}
      <Sheet open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New project</SheetTitle>
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
                  <SelectValue>
                    {({ IN_PROGRESS: "In progress", COMPLETED: "Completed" } as Record<string, string>)[form.status] ?? form.status}
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
              onClick={() => setCreateOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex-1"
            >
              Create project
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
