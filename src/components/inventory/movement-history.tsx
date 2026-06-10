"use client";

import { useEffect, useState, useTransition } from "react";
import { getItemMovementsAction } from "@/app/(app)/inventory/movement-actions";
import { Button } from "@/components/ui/button";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Movement = {
  id: string;
  type: "PURCHASE" | "USAGE" | "ADJUSTMENT";
  quantity: number;
  date: Date;
  unitCost: number | null;
  vendorName: string | null;
  note: string | null;
  order: {
    id: string;
    customer: { name: string };
  } | null;
  project: { id: string; name: string } | null;
};

interface MovementHistoryProps {
  itemId: string;
  /** bump to force a refresh */
  refreshKey?: number;
}

export function MovementHistory({ itemId, refreshKey }: MovementHistoryProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  function load() {
    setLoading(true);
    startTransition(() => {
      getItemMovementsAction(itemId)
        .then((data) => setMovements(data as Movement[]))
        .finally(() => setLoading(false));
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, refreshKey]);

  const typeIcon = {
    PURCHASE: (
      <ArrowUpCircle className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
    ),
    USAGE: (
      <ArrowDownCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
    ),
    ADJUSTMENT: (
      <SlidersHorizontal className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
    ),
  };

  const typeLabel = {
    PURCHASE: "Purchase",
    USAGE: "Usage",
    ADJUSTMENT: "Adjustment",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Movement history
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={load}
          disabled={loading}
          aria-label="Refresh history"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground italic">Loading…</p>
      ) : movements.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No movements recorded yet.
        </p>
      ) : (
        <div className="space-y-1.5">
          {movements.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-sm">
              {typeIcon[m.type]}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium">
                    {typeLabel[m.type]}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(m.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "font-medium",
                      m.quantity > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                    )}
                  >
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </span>
                  {m.unitCost != null && ` @ ₱${m.unitCost.toFixed(2)}/unit`}
                  {m.vendorName && ` · ${m.vendorName}`}
                  {m.order && ` · Order: ${m.order.customer.name}`}
                  {m.project && ` · ${m.project.name}`}
                  {m.note && ` · ${m.note}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
