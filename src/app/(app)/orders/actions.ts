"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/generated/prisma/client";

export interface OrderInput {
  customerId: string;
  revenue?: number;
  notes?: string;
}

export async function createOrderAction(input: OrderInput) {
  await requireAdmin();
  if (!input.customerId) return { error: "Customer is required." };

  await prisma.order.create({
    data: {
      customerId: input.customerId,
      revenue: input.revenue ?? null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/orders");
  return { success: true };
}

export async function updateOrderAction(
  id: string,
  input: OrderInput & { status: OrderStatus }
) {
  await requireAdmin();
  if (!input.customerId) return { error: "Customer is required." };

  await prisma.order.update({
    where: { id },
    data: {
      customerId: input.customerId,
      status: input.status,
      revenue: input.revenue ?? null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/orders");
  revalidatePath("/customers");
  return { success: true };
}

export async function deleteOrderAction(id: string) {
  await requireAdmin();

  const usageCount = await prisma.stockMovement.count({
    where: { orderId: id, type: "USAGE" },
  });
  if (usageCount > 0) {
    return {
      error: `Cannot delete — ${usageCount} usage event${usageCount !== 1 ? "s" : ""} linked to this order.`,
    };
  }

  await prisma.order.delete({ where: { id } });
  revalidatePath("/orders");
  revalidatePath("/customers");
  return { success: true };
}
