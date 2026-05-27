"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export interface ItemInput {
  name: string;
  categoryId: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  cost: number;
  location?: string;
  supplierId?: string;
  sku?: string;
  notes?: string;
}

export async function createItemAction(input: ItemInput) {
  await requireAdmin();
  if (!input.name.trim()) return { error: "Item name is required." };
  if (!input.categoryId) return { error: "Category is required." };

  await prisma.item.create({
    data: {
      name: input.name.trim(),
      categoryId: input.categoryId,
      quantity: input.quantity,
      unit: input.unit.trim() || "unit",
      lowStockThreshold: input.lowStockThreshold,
      cost: input.cost,
      location: input.location?.trim() || null,
      supplierId: input.supplierId || null,
      sku: input.sku?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function updateItemAction(id: string, input: ItemInput) {
  await requireAdmin();
  if (!input.name.trim()) return { error: "Item name is required." };
  if (!input.categoryId) return { error: "Category is required." };

  await prisma.item.update({
    where: { id },
    data: {
      name: input.name.trim(),
      categoryId: input.categoryId,
      quantity: input.quantity,
      unit: input.unit.trim() || "unit",
      lowStockThreshold: input.lowStockThreshold,
      cost: input.cost,
      location: input.location?.trim() || null,
      supplierId: input.supplierId || null,
      sku: input.sku?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteItemAction(id: string) {
  await requireAdmin();

  const movementCount = await prisma.stockMovement.count({
    where: { itemId: id },
  });
  if (movementCount > 0) {
    return {
      error: `Cannot delete — ${movementCount} stock movement${movementCount !== 1 ? "s" : ""} linked to this item.`,
    };
  }

  await prisma.item.delete({ where: { id } });
  revalidatePath("/inventory");
  return { success: true };
}
