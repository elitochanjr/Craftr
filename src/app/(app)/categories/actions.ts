"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath, revalidateTag } from "next/cache";

export async function createCategoryAction(name: string) {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  try {
    await prisma.category.create({ data: { name: trimmed } });
  } catch {
    return { error: "A category with that name already exists." };
  }

  revalidatePath("/categories");
  revalidateTag("categories", {});
  return { success: true };
}

export async function renameCategoryAction(id: string, name: string) {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  try {
    await prisma.category.update({ where: { id }, data: { name: trimmed } });
  } catch {
    return { error: "A category with that name already exists." };
  }

  revalidatePath("/categories");
  revalidateTag("categories", {});
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  await requireAuth();

  const count = await prisma.item.count({ where: { categoryId: id } });
  if (count > 0) {
    return {
      error: `Cannot delete — ${count} item${count > 1 ? "s" : ""} use this category.`,
    };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  revalidateTag("categories", {});
  return { success: true };
}
