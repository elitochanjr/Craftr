import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { OverheadItemsView } from "@/components/products/overhead-items-view";

export default async function OverheadItemsPage() {
  const session = await requireAuth();

  const items = await prisma.overheadItem.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header title="Overhead Items" />
      <OverheadItemsView items={items} role={session.user.role} />
    </>
  );
}
