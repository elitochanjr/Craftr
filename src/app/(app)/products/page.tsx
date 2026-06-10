import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ProductsView } from "@/components/products/products-view";

export default async function ProductsPage() {
  const session = await requireAuth();

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Header title="Products" />
      <ProductsView products={products} role={session.user.role} />
    </>
  );
}
