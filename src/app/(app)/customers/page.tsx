import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { CustomersView } from "@/components/customers/customers-view";

export default async function CustomersPage() {
  await requireAuth();

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header title="Customers" />
      <CustomersView customers={customers} />
    </>
  );
}
