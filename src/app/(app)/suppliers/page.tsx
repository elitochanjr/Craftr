import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { SuppliersView } from "@/components/suppliers/suppliers-view";

export default async function SuppliersPage() {
  await requireAuth();

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header title="Suppliers" />
      <SuppliersView suppliers={suppliers} />
    </>
  );
}
