"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath, revalidateTag } from "next/cache";

export interface SupplierInput {
  name: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

function cleanInput(input: SupplierInput) {
  return {
    name: input.name.trim(),
    website: input.website?.trim() || null,
    contactEmail: input.contactEmail?.trim() || null,
    contactPhone: input.contactPhone?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function createSupplierAction(input: SupplierInput) {
  await requireAuth();
  const data = cleanInput(input);
  if (!data.name) return { error: "Supplier name is required." };

  await prisma.supplier.create({ data });
  revalidatePath("/suppliers");
  revalidateTag("suppliers", {});
  return { success: true };
}

export async function updateSupplierAction(id: string, input: SupplierInput) {
  await requireAuth();
  const data = cleanInput(input);
  if (!data.name) return { error: "Supplier name is required." };

  await prisma.supplier.update({ where: { id }, data });
  revalidatePath("/suppliers");
  revalidateTag("suppliers", {});
  return { success: true };
}

export async function deleteSupplierAction(id: string) {
  await requireAuth();

  // Unlink items instead of blocking delete
  await prisma.item.updateMany({
    where: { supplierId: id },
    data: { supplierId: null },
  });

  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/suppliers");
  revalidateTag("suppliers", {});
  return { success: true };
}
