"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

// ── Purchase (stock in) ────────────────────────────────────────────────────

export interface PurchaseInput {
  itemId: string;
  date: string; // ISO date string
  vendorName?: string;
  quantity: number;
  unitCost: number;
}

export async function logPurchaseAction(input: PurchaseInput) {
  await requireAdmin();
  if (input.quantity <= 0)
    return { error: "Quantity must be a positive number." };
  if (input.unitCost < 0)
    return { error: "Unit cost cannot be negative." };

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        type: "PURCHASE",
        itemId: input.itemId,
        quantity: input.quantity, // positive = stock in
        date: new Date(input.date),
        unitCost: input.unitCost,
        vendorName: input.vendorName?.trim() || null,
      },
    });
    await tx.item.update({
      where: { id: input.itemId },
      data: { quantity: { increment: input.quantity } },
    });
  });

  revalidatePath("/inventory");
  return { success: true };
}

// ── Usage (stock out) ──────────────────────────────────────────────────────

export interface UsageInput {
  itemId: string;
  quantity: number; // positive number; will be stored as negative
  unitCost: number;
  orderId?: string;
  projectId?: string;
  note?: string;
}

export async function logUsageAction(input: UsageInput) {
  await requireAuth(); // STAFF can log usage
  if (input.quantity <= 0)
    return { error: "Quantity must be a positive number." };

  // Guard: would go negative?
  const item = await prisma.item.findUnique({
    where: { id: input.itemId },
    select: { quantity: true, name: true },
  });
  if (!item) return { error: "Item not found." };
  if (item.quantity - input.quantity < 0) {
    return {
      error: `Cannot use ${input.quantity} — only ${item.quantity} in stock.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        type: "USAGE",
        itemId: input.itemId,
        quantity: -input.quantity, // negative = stock out
        unitCost: input.unitCost,
        orderId: input.orderId || null,
        projectId: input.projectId || null,
        note: input.note?.trim() || null,
      },
    });
    await tx.item.update({
      where: { id: input.itemId },
      data: { quantity: { decrement: input.quantity } },
    });
  });

  revalidatePath("/inventory");
  revalidatePath("/orders");
  revalidatePath("/projects");
  return { success: true };
}

// ── Manual adjustment ─────────────────────────────────────────────────────

export interface AdjustmentInput {
  itemId: string;
  delta: number; // positive or negative
  reason: string;
}

export async function logAdjustmentAction(input: AdjustmentInput) {
  await requireAdmin();
  if (!input.reason.trim())
    return { error: "Reason is required for adjustments." };
  if (input.delta === 0)
    return { error: "Delta cannot be zero." };

  // Guard: would go negative?
  if (input.delta < 0) {
    const item = await prisma.item.findUnique({
      where: { id: input.itemId },
      select: { quantity: true },
    });
    if (!item) return { error: "Item not found." };
    if (item.quantity + input.delta < 0) {
      return {
        error: `Adjustment would bring quantity below zero.`,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        type: "ADJUSTMENT",
        itemId: input.itemId,
        quantity: input.delta,
        note: input.reason.trim(),
      },
    });
    await tx.item.update({
      where: { id: input.itemId },
      data: { quantity: { increment: input.delta } },
    });
  });

  revalidatePath("/inventory");
  return { success: true };
}

// ── Fetch movement history ─────────────────────────────────────────────────

export async function getItemMovementsAction(itemId: string) {
  await requireAuth();
  return prisma.stockMovement.findMany({
    where: { itemId },
    include: {
      order: { select: { id: true, customer: { select: { name: true } } } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });
}

// ── Fetch usage events for an order ───────────────────────────────────────

export async function getOrderUsageAction(orderId: string) {
  await requireAuth();
  return prisma.stockMovement.findMany({
    where: { orderId, type: "USAGE" },
    include: {
      item: { select: { id: true, name: true, unit: true } },
    },
    orderBy: { date: "desc" },
  });
}

// ── Fetch usage events for a project ──────────────────────────────────────

export async function getProjectUsageAction(projectId: string) {
  await requireAuth();
  return prisma.stockMovement.findMany({
    where: { projectId, type: "USAGE" },
    include: {
      item: { select: { id: true, name: true, unit: true } },
    },
    orderBy: { date: "desc" },
  });
}
