import { Suspense } from "react";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { InventoryView } from "@/components/inventory/inventory-view";

export default async function InventoryPage() {
  const session = await requireAuth();

  const [items, categories, suppliers] = await Promise.all([
    prisma.item.findMany({
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Header title="Inventory" />
      <Suspense>
        <InventoryView
          items={items}
          categories={categories}
          suppliers={suppliers}
          role={session.user.role}
        />
      </Suspense>
    </>
  );
}
