import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findMany: vi.fn() },
    order: { findMany: vi.fn() },
    project: { findMany: vi.fn() },
    stockMovement: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getLowStockItems,
  getCostPerOrder,
  getInventoryValue,
  getTopUsedItems,
} from "@/lib/report-queries";

const mockItemFindMany = vi.mocked(prisma.item.findMany);
const mockOrderFindMany = vi.mocked(prisma.order.findMany);
const mockMovementFindMany = vi.mocked(prisma.stockMovement.findMany);

beforeEach(() => vi.clearAllMocks());

// ── Low-stock ────────────────────────────────────────────────────────────────

describe("getLowStockItems", () => {
  it("excludes items at or above threshold", async () => {
    mockItemFindMany.mockResolvedValue([
      { id: "i1", name: "Yarn", quantity: 3, lowStockThreshold: 5, unit: "ball", supplier: null },
      { id: "i2", name: "Fabric", quantity: 5, lowStockThreshold: 5, unit: "m", supplier: null },
      { id: "i3", name: "Needle", quantity: 10, lowStockThreshold: 5, unit: "pcs", supplier: null },
    ] as any);

    const result = await getLowStockItems();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Yarn");
  });

  it("returns all items when all are below threshold", async () => {
    mockItemFindMany.mockResolvedValue([
      { id: "i1", name: "Yarn", quantity: 1, lowStockThreshold: 5, unit: "ball", supplier: null },
      { id: "i2", name: "Fabric", quantity: 2, lowStockThreshold: 10, unit: "m", supplier: null },
    ] as any);

    const result = await getLowStockItems();
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no items are below threshold", async () => {
    mockItemFindMany.mockResolvedValue([
      { id: "i1", name: "Yarn", quantity: 10, lowStockThreshold: 5, unit: "ball", supplier: null },
    ] as any);

    const result = await getLowStockItems();
    expect(result).toHaveLength(0);
  });
});

// ── Cost per order ───────────────────────────────────────────────────────────

describe("getCostPerOrder", () => {
  it("sums supply cost correctly (abs(qty) × unitCost)", async () => {
    mockOrderFindMany.mockResolvedValue([
      {
        id: "o1",
        date: new Date("2025-01-01"),
        status: "COMPLETED",
        customer: { name: "Alice" },
        stockMovements: [
          { quantity: -3, unitCost: 2.5 },  // 3 × 2.5 = 7.5
          { quantity: -5, unitCost: 4.0 },  // 5 × 4.0 = 20
        ],
      },
    ] as any);

    const result = await getCostPerOrder();
    expect(result).toHaveLength(1);
    expect(result[0].totalCost).toBeCloseTo(27.5);
    expect(result[0].customerName).toBe("Alice");
  });

  it("returns zero cost for orders with no movements", async () => {
    mockOrderFindMany.mockResolvedValue([
      {
        id: "o2",
        date: new Date(),
        status: "ACTIVE",
        customer: { name: "Bob" },
        stockMovements: [],
      },
    ] as any);

    const [order] = await getCostPerOrder();
    expect(order.totalCost).toBe(0);
  });

  it("handles null unitCost as zero", async () => {
    mockOrderFindMany.mockResolvedValue([
      {
        id: "o3",
        date: new Date(),
        status: "ACTIVE",
        customer: { name: "Carol" },
        stockMovements: [{ quantity: -10, unitCost: null }],
      },
    ] as any);

    const [order] = await getCostPerOrder();
    expect(order.totalCost).toBe(0);
  });
});

// ── Inventory value ──────────────────────────────────────────────────────────

describe("getInventoryValue", () => {
  it("computes total as sum of qty × cost", async () => {
    mockItemFindMany.mockResolvedValue([
      { quantity: 10, cost: 2, category: { name: "Yarn" } },
      { quantity: 5, cost: 4, category: { name: "Fabric" } },
    ] as any);

    const result = await getInventoryValue();
    expect(result.total).toBeCloseTo(40); // 20 + 20
  });

  it("groups value by category correctly", async () => {
    mockItemFindMany.mockResolvedValue([
      { quantity: 3, cost: 10, category: { name: "Yarn" } },
      { quantity: 2, cost: 5, category: { name: "Yarn" } },
      { quantity: 4, cost: 8, category: { name: "Fabric" } },
    ] as any);

    const result = await getInventoryValue();
    const yarn = result.byCategory.find((c) => c.name === "Yarn");
    const fabric = result.byCategory.find((c) => c.name === "Fabric");
    expect(yarn?.value).toBeCloseTo(40); // 30 + 10
    expect(fabric?.value).toBeCloseTo(32); // 32
  });
});

// ── Top used items ───────────────────────────────────────────────────────────

describe("getTopUsedItems", () => {
  it("ranks items by total quantity consumed descending", async () => {
    mockMovementFindMany.mockResolvedValue([
      { quantity: -2, item: { id: "a", name: "Yarn", unit: "ball", category: { name: "Fiber" } } },
      { quantity: -8, item: { id: "b", name: "Fabric", unit: "m", category: { name: "Textile" } } },
      { quantity: -3, item: { id: "a", name: "Yarn", unit: "ball", category: { name: "Fiber" } } },
    ] as any);

    const result = await getTopUsedItems();
    expect(result[0].name).toBe("Fabric"); // 8 total
    expect(result[1].name).toBe("Yarn");   // 5 total
    expect(result[0].totalUsed).toBe(8);
    expect(result[1].totalUsed).toBe(5);
  });

  it("respects the limit parameter", async () => {
    const movements = Array.from({ length: 5 }, (_, i) => ({
      quantity: -(i + 1) * 10,
      item: { id: `item${i}`, name: `Item ${i}`, unit: "unit", category: { name: "Cat" } },
    }));
    mockMovementFindMany.mockResolvedValue(movements as any);

    const result = await getTopUsedItems(3);
    expect(result).toHaveLength(3);
  });
});
