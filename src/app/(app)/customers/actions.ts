"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export interface CustomerInput {
  name: string;
  email?: string;
  phone?: string;
}

function clean(input: CustomerInput) {
  return {
    name: input.name.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
  };
}

export async function createCustomerAction(input: CustomerInput) {
  await requireAuth();
  const data = clean(input);
  if (!data.name) return { error: "Customer name is required." };

  await prisma.customer.create({ data });
  revalidatePath("/customers");
  return { success: true };
}

export async function updateCustomerAction(id: string, input: CustomerInput) {
  await requireAuth();
  const data = clean(input);
  if (!data.name) return { error: "Customer name is required." };

  await prisma.customer.update({ where: { id }, data });
  revalidatePath("/customers");
  return { success: true };
}

export async function deleteCustomerAction(id: string) {
  await requireAuth();

  const orderCount = await prisma.order.count({ where: { customerId: id } });
  if (orderCount > 0) {
    return {
      error: `Cannot delete — ${orderCount} order${orderCount > 1 ? "s" : ""} linked to this customer.`,
    };
  }

  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  return { success: true };
}
