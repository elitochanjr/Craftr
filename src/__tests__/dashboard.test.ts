import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findMany: vi.fn() },
    item: { findMany: vi.fn() },
    stockMovement: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/dashboard-queries";

const mockOrderFindMany = vi.mocked(prisma.order.findMany);
const mockItemFindMany = vi.mocked(prisma.item.findMany);
const mockMovementFindMany = vi.mocked(prisma.stockMovement.findMany);

beforeEach(() => vi.clearAllMocks());

describe("getDashboardData", () => {
  it("returns only ACTIVE orders", async () => {
    mockOrderFindMany.mockResolvedValue([
      {
        id: "o1",
        date: new Date(),
        customer: { name: "Alice" },
        stockMovements: [],
      },
    ] as any);
    mockItemFindMany.mockResolvedValue([]);
    mockMovementFindMany.mockResolvedValue([]);

    const { activeOrders } = await getDashboardData();
    expect(activeOrders).toHaveLength(1);
    expect(activeOrders[0].customerName).toBe("Alice");
  });

  it("computes supply cost for active orders", async () => {
    mockOrderFindMany.mockResolvedValue([
      {
        id: "o1",
        date: new Date(),
        customer: { name: "Bob" },
        stockMovements: [
          { quantity: -4, unitCost: 3 },   // 12
          { quantity: -2, unitCost: 5 },   // 10
        ],
      },
    ] as any);
    mockItemFindMany.mockResolvedValue([]);
    mockMovementFindMany.mockResolvedValue([]);

    const { activeOrders } = await getDashboardData();
    expect(activeOrders[0].supplyCost).toBeCloseTo(22);
  });

  it("returns only items below their low-stock threshold", async () => {
    mockOrderFindMany.mockResolvedValue([]);
    mockItemFindMany.mockResolvedValue([
      { id: "i1", name: "Yarn", quantity: 2, lowStockThreshold: 5, unit: "ball", supplier: null },
      { id: "i2", name: "Fabric", quantity: 10, lowStockThreshold: 5, unit: "m", supplier: null },
    ] as any);
    mockMovementFindMany.mockResolvedValue([]);

    const { lowStockItems } = await getDashboardData();
    expect(lowStockItems).toHaveLength(1);
    expect(lowStockItems[0].name).toBe("Yarn");
  });

  it("returns last 10 stock movements as recent activity", async () => {
    mockOrderFindMany.mockResolvedValue([]);
    mockItemFindMany.mockResolvedValue([]);
    const movements = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`,
      type: "PURCHASE",
      quantity: i + 1,
      date: new Date(),
      item: { id: `item${i}`, name: `Item ${i}` },
    }));
    mockMovementFindMany.mockResolvedValue(movements as any);

    const { recentActivity } = await getDashboardData();
    expect(recentActivity).toHaveLength(10);
  });

  it("returns empty arrays when there is no data", async () => {
    mockOrderFindMany.mockResolvedValue([]);
    mockItemFindMany.mockResolvedValue([]);
    mockMovementFindMany.mockResolvedValue([]);

    const data = await getDashboardData();
    expect(data.activeOrders).toHaveLength(0);
    expect(data.lowStockItems).toHaveLength(0);
    expect(data.recentActivity).toHaveLength(0);
  });
});
