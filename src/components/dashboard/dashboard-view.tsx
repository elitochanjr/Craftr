"use client";

import Link from "next/link";
import { ShoppingBag, AlertTriangle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/dashboard-queries";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const MOVEMENT_LABEL: Record<string, string> = {
  PURCHASE: "Purchase",
  USAGE: "Usage",
  ADJUSTMENT: "Adjustment",
};

const MOVEMENT_COLOR: Record<string, string> = {
  PURCHASE: "text-green-600 dark:text-green-400",
  USAGE: "text-orange-600 dark:text-orange-400",
  ADJUSTMENT: "text-blue-600 dark:text-blue-400",
};

function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="font-semibold text-base">{title}</h2>
      <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground py-6 text-center">{message}</p>
  );
}

export function DashboardView({
  activeOrders,
  lowStockItems,
  recentActivity,
}: DashboardData) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold tracking-tight mb-1">
        Today&apos;s Focus
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        What needs your attention right now.
      </p>

      <div className="grid gap-6">
        {/* ── Active Orders ── */}
        <section className="rounded-lg border border-border bg-card p-4">
          <SectionHeader
            icon={ShoppingBag}
            title="Active Orders"
            count={activeOrders.length}
          />
          {activeOrders.length === 0 ? (
            <EmptyCard message="No active orders." />
          ) : (
            <div className="divide-y divide-border">
              {activeOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/orders"
                  className="flex items-center justify-between py-3 hover:bg-muted/50 px-1 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-right">
                    {fmt(order.supplyCost)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Restock Alerts ── */}
        <section className="rounded-lg border border-border bg-card p-4">
          <SectionHeader
            icon={AlertTriangle}
            title="Restock Alerts"
            count={lowStockItems.length}
          />
          {lowStockItems.length === 0 ? (
            <EmptyCard message="All items are stocked above their thresholds." />
          ) : (
            <div className="divide-y divide-border">
              {lowStockItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/inventory?item=${item.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 px-1 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.supplier?.name ?? "No supplier"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-destructive">
                      {item.quantity} {item.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      threshold: {item.lowStockThreshold}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Activity ── */}
        <section className="rounded-lg border border-border bg-card p-4">
          <SectionHeader
            icon={Activity}
            title="Recent Activity"
            count={recentActivity.length}
          />
          {recentActivity.length === 0 ? (
            <EmptyCard message="No stock movements recorded yet." />
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3 px-1">
                  <div>
                    <p className="text-sm font-medium">{m.item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-medium", MOVEMENT_COLOR[m.type])}>
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {MOVEMENT_LABEL[m.type]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
