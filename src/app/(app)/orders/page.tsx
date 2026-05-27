import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { OrdersView } from "@/components/orders/orders-view";

export default async function OrdersPage() {
  const session = await requireAuth();

  const [orders, customers, items] = await Promise.all([
    prisma.order.findMany({
      include: {
        customer: { select: { id: true, name: true } },
        _count: { select: { stockMovements: true } },
        stockMovements: {
          where: { type: "USAGE" },
          select: { quantity: true, unitCost: true },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.item.findMany({
      select: {
        id: true,
        name: true,
        unit: true,
        cost: true,
        quantity: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Compute total supply cost per order
  const ordersWithCost = orders.map((o) => ({
    ...o,
    totalSupplyCost: o.stockMovements.reduce(
      (sum, m) => sum + Math.abs(m.quantity) * (m.unitCost ?? 0),
      0
    ),
    stockMovements: undefined, // strip before passing to client
  }));

  return (
    <>
      <Header title="Orders" />
      <OrdersView
        orders={ordersWithCost}
        customers={customers}
        items={items}
        role={session.user.role}
      />
    </>
  );
}
