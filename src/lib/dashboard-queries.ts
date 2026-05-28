import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [activeOrders, lowStockItems, recentActivity] = await Promise.all([
    prisma.order.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        date: true,
        customer: { select: { name: true } },
        stockMovements: {
          where: { type: "USAGE" },
          select: { quantity: true, unitCost: true },
        },
      },
      orderBy: { date: "desc" },
    }),

    prisma.item.findMany({
      select: {
        id: true,
        name: true,
        quantity: true,
        lowStockThreshold: true,
        unit: true,
        supplier: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }).then((items) => items.filter((i) => i.quantity < i.lowStockThreshold)),

    prisma.stockMovement.findMany({
      take: 10,
      orderBy: { date: "desc" },
      select: {
        id: true,
        type: true,
        quantity: true,
        date: true,
        item: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    activeOrders: activeOrders.map((o) => ({
      id: o.id,
      customerName: o.customer.name,
      date: o.date,
      supplyCost: o.stockMovements.reduce(
        (sum, m) => sum + Math.abs(m.quantity) * (m.unitCost ?? 0),
        0
      ),
    })),
    lowStockItems,
    recentActivity,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
