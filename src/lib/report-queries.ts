import { prisma } from "@/lib/prisma";

// ── Low-stock items ──────────────────────────────────────────────────────────

export async function getLowStockItems() {
  const items = await prisma.item.findMany({
    select: {
      id: true,
      name: true,
      quantity: true,
      lowStockThreshold: true,
      unit: true,
      supplier: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
  return items.filter((i) => i.quantity < i.lowStockThreshold);
}

// ── Cost per order ───────────────────────────────────────────────────────────

export async function getCostPerOrder() {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      date: true,
      status: true,
      customer: { select: { name: true } },
      stockMovements: {
        where: { type: "USAGE" },
        select: { quantity: true, unitCost: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return orders.map((o) => ({
    id: o.id,
    customerName: o.customer.name,
    date: o.date,
    status: o.status,
    totalCost: o.stockMovements.reduce(
      (sum, m) => sum + Math.abs(m.quantity) * (m.unitCost ?? 0),
      0
    ),
  }));
}

// ── Cost per project ─────────────────────────────────────────────────────────

export async function getCostPerProject() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      stockMovements: {
        where: { type: "USAGE" },
        select: { quantity: true, unitCost: true },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    startDate: p.startDate,
    totalCost: p.stockMovements.reduce(
      (sum, m) => sum + Math.abs(m.quantity) * (m.unitCost ?? 0),
      0
    ),
  }));
}

// ── Total inventory value ────────────────────────────────────────────────────

export async function getInventoryValue() {
  const items = await prisma.item.findMany({
    select: {
      quantity: true,
      cost: true,
      category: { select: { name: true } },
    },
  });

  const total = items.reduce((sum, i) => sum + i.quantity * i.cost, 0);

  const byCategory: Record<string, number> = {};
  for (const item of items) {
    const cat = item.category.name;
    byCategory[cat] = (byCategory[cat] ?? 0) + item.quantity * item.cost;
  }

  return {
    total,
    byCategory: Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  };
}

// ── Spending over time (by month) ────────────────────────────────────────────

export async function getSpendingOverTime() {
  const movements = await prisma.stockMovement.findMany({
    where: { type: "PURCHASE" },
    select: {
      date: true,
      quantity: true,
      unitCost: true,
      item: { select: { category: { select: { name: true } } } },
    },
    orderBy: { date: "asc" },
  });

  const byMonth: Record<string, Record<string, number>> = {};

  for (const m of movements) {
    const month = m.date.toISOString().slice(0, 7); // "YYYY-MM"
    const cat = m.item.category.name;
    const cost = m.quantity * (m.unitCost ?? 0);
    if (!byMonth[month]) byMonth[month] = {};
    byMonth[month][cat] = (byMonth[month][cat] ?? 0) + cost;
  }

  return Object.entries(byMonth).map(([month, cats]) => ({
    month,
    ...cats,
    total: Object.values(cats).reduce((s, v) => s + v, 0),
  }));
}

// ── Top used items ───────────────────────────────────────────────────────────

export async function getTopUsedItems(limit = 10) {
  const movements = await prisma.stockMovement.findMany({
    where: { type: "USAGE" },
    select: {
      quantity: true,
      item: {
        select: {
          id: true,
          name: true,
          unit: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  const totals: Record<string, { name: string; category: string; unit: string; totalUsed: number }> = {};
  for (const m of movements) {
    const id = m.item.id;
    if (!totals[id]) {
      totals[id] = {
        name: m.item.name,
        category: m.item.category.name,
        unit: m.item.unit,
        totalUsed: 0,
      };
    }
    totals[id].totalUsed += Math.abs(m.quantity);
  }

  return Object.values(totals)
    .sort((a, b) => b.totalUsed - a.totalUsed)
    .slice(0, limit);
}
