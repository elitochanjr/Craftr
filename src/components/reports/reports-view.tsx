"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types (mirroring report-queries return shapes) ──────────────────────────

type LowStockItem = {
  id: string;
  name: string;
  quantity: number;
  lowStockThreshold: number;
  unit: string;
  supplier: { name: string } | null;
};

type OrderCost = {
  id: string;
  customerName: string;
  date: Date;
  status: string;
  totalCost: number;
};

type ProjectCost = {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  totalCost: number;
};

type InventoryValue = {
  total: number;
  byCategory: { name: string; value: number }[];
};

type SpendingRow = { month: string; total: number; [cat: string]: string | number };

type TopItem = {
  name: string;
  category: string;
  unit: string;
  totalUsed: number;
};

interface ReportsViewProps {
  lowStock: LowStockItem[];
  costPerOrder: OrderCost[];
  costPerProject: ProjectCost[];
  inventoryValue: InventoryValue;
  spending: SpendingRow[];
  topUsed: TopItem[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  COMPLETED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold tracking-tight mb-3">{children}</h2>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground py-4 text-center">{message}</p>
  );
}

// Derive category keys from spending data
function getCategoryKeys(spending: SpendingRow[]): string[] {
  const keys = new Set<string>();
  for (const row of spending) {
    for (const k of Object.keys(row)) {
      if (k !== "month" && k !== "total") keys.add(k);
    }
  }
  return Array.from(keys);
}

const CHART_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#06b6d4",
];

export function ReportsView({
  lowStock,
  costPerOrder,
  costPerProject,
  inventoryValue,
  spending,
  topUsed,
}: ReportsViewProps) {
  const [orderSort, setOrderSort] = useState<"cost" | "date">("cost");
  const [projectSort, setProjectSort] = useState<"cost" | "date">("cost");

  const sortedOrders = [...costPerOrder].sort((a, b) =>
    orderSort === "cost"
      ? b.totalCost - a.totalCost
      : new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const sortedProjects = [...costPerProject].sort((a, b) =>
    projectSort === "cost"
      ? b.totalCost - a.totalCost
      : new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const categoryKeys = getCategoryKeys(spending);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      {/* ── 1. Low-stock report ── */}
      <section>
        <SectionTitle>Low-Stock Items</SectionTitle>
        {lowStock.length === 0 ? (
          <EmptyState message="No items below their restock threshold." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Item</th>
                  <th className="text-right px-4 py-2 font-medium">Qty</th>
                  <th className="text-right px-4 py-2 font-medium">Threshold</th>
                  <th className="text-left px-4 py-2 font-medium">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2 text-right text-destructive font-medium">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {item.lowStockThreshold} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {item.supplier?.name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 2a. Cost per order ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Cost per Order</SectionTitle>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setOrderSort("cost")}
              className={cn(
                "px-2 py-1 rounded border transition-colors",
                orderSort === "cost"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              By cost
            </button>
            <button
              onClick={() => setOrderSort("date")}
              className={cn(
                "px-2 py-1 rounded border transition-colors",
                orderSort === "date"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              By date
            </button>
          </div>
        </div>
        {sortedOrders.length === 0 ? (
          <EmptyState message="No orders recorded yet." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Customer</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-right px-4 py-2 font-medium">Supply Cost</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{o.customerName}</td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          STATUS_COLORS[o.status] ?? ""
                        )}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(o.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {fmt(o.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 2b. Cost per project ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Cost per Project</SectionTitle>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setProjectSort("cost")}
              className={cn(
                "px-2 py-1 rounded border transition-colors",
                projectSort === "cost"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              By cost
            </button>
            <button
              onClick={() => setProjectSort("date")}
              className={cn(
                "px-2 py-1 rounded border transition-colors",
                projectSort === "date"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              )}
            >
              By date
            </button>
          </div>
        </div>
        {sortedProjects.length === 0 ? (
          <EmptyState message="No projects recorded yet." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Project</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Started</th>
                  <th className="text-right px-4 py-2 font-medium">Supply Cost</th>
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          STATUS_COLORS[p.status] ?? ""
                        )}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(p.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {fmt(p.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 3. Total inventory value ── */}
      <section>
        <SectionTitle>Total Inventory Value</SectionTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="rounded-lg border border-border bg-card p-5 flex-shrink-0">
            <p className="text-sm text-muted-foreground mb-1">Total Value</p>
            <p className="text-3xl font-bold tracking-tight">{fmt(inventoryValue.total)}</p>
          </div>
          {inventoryValue.byCategory.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border flex-1">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Category</th>
                    <th className="text-right px-4 py-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryValue.byCategory.map((c) => (
                    <tr key={c.name} className="border-t border-border">
                      <td className="px-4 py-2">{c.name}</td>
                      <td className="px-4 py-2 text-right font-medium">{fmt(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Spending over time ── */}
      <section>
        <SectionTitle>Spending Over Time</SectionTitle>
        {spending.length === 0 ? (
          <EmptyState message="No purchase data yet." />
        ) : (
          <div className="h-64 rounded-lg border border-border p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spending} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => (typeof v === "number" ? fmt(v) : v)} />
                <Legend />
                {categoryKeys.map((cat, i) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="a"
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ── 5. Top used items ── */}
      <section>
        <SectionTitle>Top Used Items</SectionTitle>
        {topUsed.length === 0 ? (
          <EmptyState message="No usage recorded yet." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">#</th>
                  <th className="text-left px-4 py-2 font-medium">Item</th>
                  <th className="text-left px-4 py-2 font-medium">Category</th>
                  <th className="text-right px-4 py-2 font-medium">Total Used</th>
                </tr>
              </thead>
              <tbody>
                {topUsed.map((item, idx) => (
                  <tr key={item.name} className="border-t border-border">
                    <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-2 text-right">
                      {item.totalUsed} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
