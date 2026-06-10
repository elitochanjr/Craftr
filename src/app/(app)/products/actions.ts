"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function getProductsAction() {
  await requireAuth();
  return prisma.product.findMany({ orderBy: { name: "asc" } });
}

export async function createProductAction(name: string) {
  await requireAdmin();
  if (!name.trim()) return { error: "Product name is required." };

  const product = await prisma.product.create({
    data: { name: name.trim() },
  });

  revalidatePath("/products");
  return { success: true, id: product.id };
}

export async function updateProductAction(
  id: string,
  data: { name: string; stockQuantity: number }
) {
  await requireAdmin();
  if (!data.name.trim()) return { error: "Product name is required." };

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name.trim(),
      stockQuantity: data.stockQuantity,
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { success: true };
}

export async function deleteProductAction(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { success: true };
}

export async function adjustStockAction(id: string, delta: number) {
  await requireAdmin();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { error: "Product not found." };

  const newQty = product.stockQuantity + delta;
  if (newQty < 0) return { error: "Stock quantity cannot go below zero." };

  await prisma.product.update({
    where: { id },
    data: { stockQuantity: newQty },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { success: true };
}
