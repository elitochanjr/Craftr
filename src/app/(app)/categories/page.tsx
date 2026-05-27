import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { CategoriesView } from "@/components/categories/categories-view";

export default async function CategoriesPage() {
  await requireAuth();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Header title="Categories" />
      <CategoriesView categories={categories} />
    </>
  );
}
