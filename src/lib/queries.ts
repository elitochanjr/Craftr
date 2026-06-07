import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getCategories = unstable_cache(
  () => prisma.category.findMany({ orderBy: { name: "asc" } }),
  ["categories"],
  { tags: ["categories"] }
);

export const getSuppliers = unstable_cache(
  () => prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ["suppliers"],
  { tags: ["suppliers"] }
);
