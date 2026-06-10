"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getOrderUsageAction,
  getProjectUsageAction,
  updateUsageAction,
  deleteUsageAction,
} from "@/app/(app)/inventory/movement-actions";
import { RefreshCw, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type UsageEvent = {
  id: string;
  quantity: number;
  unitCost: number | null;
  date: Date;
  item: { id: string; name: string; unit: string };
};

interface UsageListProps {
  orderId?: string;
  projectId?: string;
  refreshKey?: number;
  onTotalCostChange?: (total: number) => void;
}

export function UsageList({
  orderId,
  projectId,
  refreshKey,
  onTotalCostChange,
}: UsageListProps) {
  const [events, setEvents] = useState<UsageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    startTransition(() => {
      const fetcher = orderId
        ? getOrderUsageAction(orderId)
        : getProjectUsageAction(projectId!);
      fetcher
        .then((data) => {
          setEvents(data as UsageEvent[]);
          const total = data.reduce(
            (sum, m) => sum + Math.abs(m.quantity) * (m.unitCost ?? 0),
            0
          );
          onTotalCostChange?.(total);
        })
        .finally(() => setLoading(false));
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, projectId, refreshKey]);

  function startEdit(e: UsageEvent) {
    setEditingId(e.id);
    setEditQty(String(Math.abs(e.quantity)));
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  function handleSaveEdit(e: UsageEvent) {
    const qty = parseFloat(editQty);
    if (isNaN(qty) || qty <= 0) {
      setEditError("Quantity must be greater than zero.");
      return;
    }
    startTransition(async () => {
      const res = await updateUsageAction(e.id, { quantity: qty });
      if (res.error) {
        setEditError(res.error);
      } else {
        setEditingId(null);
        load();
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteUsageAction(deleteId);
      setDeleteId(null);
      load();
    });
  }

  const deleteTarget = events.find((e) => e.id === deleteId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Supply usage
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={load}
          disabled={loading}
          aria-label="Refresh usage"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground italic">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No supply usage logged yet.
        </p>
      ) : (
        <div className="space-y-1.5">
          {events.map((e) =>
            editingId === e.id ? (
              <div key={e.id} className="rounded-md border border-border px-3 py-2.5 space-y-2">
                <p className="text-sm font-medium">{e.item.name}</p>
                {editError && (
                  <p className="text-xs text-destructive">{editError}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0.001}
                        step="any"
                        value={editQty}
                        onChange={(ev) => setEditQty(ev.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <span className="text-xs text-muted-foreground shrink-0">
                        {e.item.unit}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Unit cost (₱)</p>
                    <Input
                      type="number"
                      value={e.unitCost ?? ""}
                      readOnly
                      className="h-7 text-sm bg-muted text-muted-foreground"
                    />
                  </div>
                </div>
                {editQty && e.unitCost != null && (
                  <p className="text-xs text-muted-foreground">
                    Total:{" "}
                    <span className="font-medium text-foreground">
                      ₱{(parseFloat(editQty) * e.unitCost).toFixed(2)}
                    </span>
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleSaveEdit(e)}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div key={e.id} className="flex items-start justify-between text-sm gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.abs(e.quantity)} {e.item.unit} ·{" "}
                    {new Date(e.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {e.unitCost != null
                      ? `₱${(Math.abs(e.quantity) * e.unitCost).toFixed(2)}`
                      : "—"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6"
                    onClick={() => startEdit(e)}
                    aria-label="Edit usage"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(e.id)}
                    aria-label="Delete usage"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove usage entry</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove{" "}
            {deleteTarget && (
              <strong>
                {Math.abs(deleteTarget.quantity)} {deleteTarget.item.unit} of {deleteTarget.item.name}
              </strong>
            )}
            ? Inventory will be restored. This cannot be undone.
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
