"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getOrderUsageAction,
  getProjectUsageAction,
} from "@/app/(app)/inventory/movement-actions";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  /** bump to force a refresh */
  refreshKey?: number;
  /** called with updated total cost after load */
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
          {events.map((e) => (
            <div key={e.id} className="flex items-start justify-between text-sm gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{e.item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.abs(e.quantity)} {e.item.unit} ·{" "}
                  {new Date(e.date).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {e.unitCost != null
                  ? `$${(Math.abs(e.quantity) * e.unitCost).toFixed(2)}`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
