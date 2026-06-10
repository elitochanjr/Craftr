"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export interface OverheadItemInput {
  name: string;
  costPerUse: number;
}

export async function getOverheadItemsAction() {
  await requireAuth();
  const items = await prisma.overheadItem.findMany({
    orderBy: { name: "asc" },
  });
  return items;
}

export async function createOverheadItemAction(
  input: OverheadItemInput
): Promise<{ success: true; id: string } | { error: string }> {
  await requireAdmin();
  if (!input.name.trim()) return { error: "Name is required." };
  if (input.costPerUse < 0) return { error: "Cost per use cannot be negative." };

  const item = await prisma.overheadItem.create({
    data: {
      name: input.name.trim(),
      costPerUse: input.costPerUse,
    },
  });

  revalidatePath("/products/overhead");
  return { success: true, id: item.id };
}

export async function updateOverheadItemAction(
  id: string,
  input: OverheadItemInput
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  if (!input.name.trim()) return { error: "Name is required." };
  if (input.costPerUse < 0) return { error: "Cost per use cannot be negative." };

  await prisma.overheadItem.update({
    where: { id },
    data: {
      name: input.name.trim(),
      costPerUse: input.costPerUse,
    },
  });

  revalidatePath("/products/overhead");
  return { success: true };
}

export async function deleteOverheadItemAction(
  id: string
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  await prisma.overheadItem.delete({ where: { id } });
  revalidatePath("/products/overhead");
  return { success: true };
}
