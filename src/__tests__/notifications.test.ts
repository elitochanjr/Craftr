import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}));

vi.mock("@/lib/email", () => ({
  sendLowStockEmail: vi.fn(),
}));

import { maybeNotifyLowStock } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { sendLowStockEmail } from "@/lib/email";

const mockFindMany = vi.mocked(prisma.user.findMany);
const mockCreateMany = vi.mocked(prisma.notification.createMany);
const mockSendEmail = vi.mocked(sendLowStockEmail);

const ADMIN_USER = { id: "u1", role: "ADMIN" as const, email: "admin@test.com" };
const STAFF_USER = { id: "u2", role: "STAFF" as const, email: "staff@test.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([ADMIN_USER, STAFF_USER] as any);
  mockCreateMany.mockResolvedValue({ count: 2 });
  mockSendEmail.mockResolvedValue(undefined);
});

describe("maybeNotifyLowStock", () => {
  it("creates notifications for all users when threshold is crossed", async () => {
    // oldQty=10 (above threshold=5), newQty=3 (below threshold) → crossing
    await maybeNotifyLowStock("item1", "Yarn", 10, 3, 5);

    expect(mockCreateMany).toHaveBeenCalledOnce();
    const call = mockCreateMany.mock.calls[0][0] as { data: unknown[] };
    expect(call.data).toHaveLength(2);
    expect(call.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: "u1", itemId: "item1", type: "LOW_STOCK" }),
        expect.objectContaining({ userId: "u2", itemId: "item1", type: "LOW_STOCK" }),
      ])
    );
  });

  it("sends a low-stock email only to admin users", async () => {
    await maybeNotifyLowStock("item1", "Yarn", 10, 3, 5);

    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      "admin@test.com",
      "Yarn",
      3,
      5,
      "item1"
    );
  });

  it("does nothing when usage stays above threshold", async () => {
    // oldQty=10, newQty=7, threshold=5 → no crossing
    await maybeNotifyLowStock("item1", "Yarn", 10, 7, 5);

    expect(mockCreateMany).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("does nothing when item was already below threshold before usage", async () => {
    // oldQty=3 (already below threshold=5), newQty=1 → no crossing from above
    await maybeNotifyLowStock("item1", "Yarn", 3, 1, 5);

    expect(mockCreateMany).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("does nothing when usage lands exactly on threshold", async () => {
    // oldQty=10, newQty=5 (equal to threshold, not below) → no notification
    await maybeNotifyLowStock("item1", "Yarn", 10, 5, 5);

    expect(mockCreateMany).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("fires again when item restocks above threshold and drops below again", async () => {
    // First drop below: oldQty=10, newQty=3
    await maybeNotifyLowStock("item1", "Yarn", 10, 3, 5);
    expect(mockCreateMany).toHaveBeenCalledOnce();

    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([ADMIN_USER, STAFF_USER] as any);
    mockCreateMany.mockResolvedValue({ count: 2 });
    mockSendEmail.mockResolvedValue(undefined);

    // Restocked to 20 (above threshold), then drops to 2 (crossing again)
    await maybeNotifyLowStock("item1", "Yarn", 20, 2, 5);
    expect(mockCreateMany).toHaveBeenCalledOnce();
  });
});
