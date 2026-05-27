import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { CustomersView } from "@/components/customers/customers-view";

export default async function CustomersPage() {
  await requireAuth();

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { orders: true } },
      orders: {
        select: { revenue: true },
      },
    },
  });

  // Compute totals server-side
  const customersWithStats = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    orderCount: c._count.orders,
    totalRevenue: c.orders.reduce((sum, o) => sum + (o.revenue ?? 0), 0),
  }));

  return (
    <>
      <Header title="Customers" />
      <CustomersView customers={customersWithStats} />
    </>
  );
}
