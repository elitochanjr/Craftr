import { Suspense } from "react";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { InventoryView } from "@/components/inventory/inventory-view";
import { getCategories, getSuppliers } from "@/lib/queries";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import type { Role } from "@/generated/prisma/client";

async function ItemsLoader({
  categories,
  suppliers,
  role,
}: {
  categories: Awaited<ReturnType<typeof getCategories>>;
  suppliers: Awaited<ReturnType<typeof getSuppliers>>;
  role: Role;
}) {
  const items = await prisma.item.findMany({
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <InventoryView
      items={items}
      categories={categories}
      suppliers={suppliers}
      role={role}
    />
  );
}

export default async function InventoryPage() {
  const session = await requireAuth();

  const [categories, suppliers] = await Promise.all([
    getCategories(),
    getSuppliers(),
  ]);

  return (
    <>
      <Header title="Inventory" />
      <Suspense fallback={<PageSkeleton />}>
        <ItemsLoader
          categories={categories}
          suppliers={suppliers}
          role={session.user.role}
        />
      </Suspense>
    </>
  );
}
