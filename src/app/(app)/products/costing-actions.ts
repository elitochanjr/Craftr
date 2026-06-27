"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export interface CostingInput {
  laborRatePerHour: number | null;
  laborTimeMinutes: number | null;
  generalExpensesPercent: number;
  spoilagePercent: number;
  outputPieces: number;
  taxEnabled: boolean;
  markupPercent: number;
  discountPercent: number;
  finalRetailPrice: number | null;
  materials: Array<{ itemId: string; quantity: number }>;
  overheadIds: string[];
}

export async function saveCostingAction(
  productId: string,
  input: CostingInput
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();

  if (!Number.isInteger(input.outputPieces) || input.outputPieces < 1) {
    return { error: "Output pieces must be at least 1." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update Product costing fields
      await tx.product.update({
        where: { id: productId },
        data: {
          laborRatePerHour: input.laborRatePerHour,
          laborTimeMinutes: input.laborTimeMinutes,
          generalExpensesPercent: input.generalExpensesPercent,
          spoilagePercent: input.spoilagePercent,
          outputPieces: input.outputPieces,
          taxEnabled: input.taxEnabled,
          markupPercent: input.markupPercent,
          discountPercent: input.discountPercent,
          finalRetailPrice: input.finalRetailPrice,
        },
      });

      // Replace materials
      await tx.productMaterial.deleteMany({ where: { productId } });
      if (input.materials.length > 0) {
        await tx.productMaterial.createMany({
          data: input.materials.map((m) => ({
            productId,
            itemId: m.itemId,
            quantity: m.quantity,
          })),
        });
      }

      // Replace overheads
      await tx.productOverhead.deleteMany({ where: { productId } });
      if (input.overheadIds.length > 0) {
        await tx.productOverhead.createMany({
          data: input.overheadIds.map((overheadItemId) => ({
            productId,
            overheadItemId,
          })),
        });
      }
    });

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (err) {
    console.error("saveCostingAction error:", err);
    return { error: "Failed to save costing data." };
  }
}
