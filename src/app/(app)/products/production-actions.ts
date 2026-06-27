"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export interface ProductionRunInput {
  productId: string;
  piecesProduced: number;
  notes?: string;
}

export interface InsufficientStockWarning {
  itemId: string;
  itemName: string;
  unit: string;
  required: number;
  available: number;
}

/**
 * Check materials before committing. Returns warnings for any material
 * with insufficient stock. Does NOT write anything to the database.
 */
export async function checkProductionStockAction(
  productId: string,
  piecesProduced: number
): Promise<{ warnings: InsufficientStockWarning[]; error?: string }> {
  await requireAdmin();
  if (piecesProduced <= 0)
    return { warnings: [], error: "Pieces produced must be a positive number." };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      outputPieces: true,
      materials: {
        include: {
          item: { select: { id: true, name: true, unit: true, quantity: true } },
        },
      },
    },
  });

  if (!product) return { warnings: [], error: "Product not found." };

  const outputPieces = product.outputPieces || 1;
  const warnings: InsufficientStockWarning[] = [];

  for (const mat of product.materials) {
    const materialUsed = mat.quantity * (piecesProduced / outputPieces);
    if (mat.item.quantity < materialUsed) {
      warnings.push({
        itemId: mat.item.id,
        itemName: mat.item.name,
        unit: mat.item.unit,
        required: materialUsed,
        available: mat.item.quantity,
      });
    }
  }

  return { warnings };
}

/**
 * Record a production run:
 * - Creates a ProductionRun record
 * - Creates a USAGE StockMovement per material consumed (can go negative)
 * - Decrements each material Item.quantity
 * - Increments Product.stockQuantity by piecesProduced
 * All in a single Prisma transaction.
 */
export async function recordProductionAction(
  input: ProductionRunInput
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin();

  const { productId, piecesProduced, notes } = input;

  if (piecesProduced <= 0)
    return { error: "Pieces produced must be a positive number." };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      outputPieces: true,
      materials: {
        include: {
          item: { select: { id: true, name: true, unit: true, cost: true } },
        },
      },
    },
  });

  if (!product) return { error: "Product not found." };

  const outputPieces = product.outputPieces || 1;

  await prisma.$transaction(async (tx) => {
    // 1. Create the ProductionRun record
    const run = await tx.productionRun.create({
      data: {
        productId,
        piecesProduced,
        notes: notes?.trim() || null,
        date: new Date(),
      },
    });

    // 2. For each material, create a USAGE StockMovement and decrement inventory
    for (const mat of product.materials) {
      const materialUsed = mat.quantity * (piecesProduced / outputPieces);
      if (materialUsed <= 0) continue;

      await tx.stockMovement.create({
        data: {
          type: "USAGE",
          itemId: mat.item.id,
          quantity: -materialUsed, // negative = stock out
          unitCost: mat.item.cost,
          note: `Production run: ${piecesProduced} piece${piecesProduced !== 1 ? "s" : ""}`,
          productionRunId: run.id,
        },
      });

      await tx.item.update({
        where: { id: mat.item.id },
        data: { quantity: { decrement: materialUsed } },
      });
    }

    // 3. Increment finished product stock
    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: { increment: piecesProduced } },
    });
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/inventory");

  return { success: true };
}

/**
 * Fetch all production runs for a product (newest first).
 */
export async function getProductionRunsAction(productId: string) {
  await requireAdmin();
  return prisma.productionRun.findMany({
    where: { productId },
    orderBy: { date: "desc" },
  });
}
