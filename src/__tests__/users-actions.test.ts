import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth-helpers", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  approveUserAction,
  rejectUserAction,
} from "@/app/(app)/settings/users/actions";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const mockUpdate = vi.mocked(prisma.user.update);
const mockDelete = vi.mocked(prisma.user.delete);
const mockRequireAdmin = vi.mocked(requireAdmin);

const ADMIN_SESSION = {
  user: { id: "admin1", email: "admin@test.com", role: "ADMIN" as const, status: "ACTIVE" as const },
  expires: "2099-01-01",
} as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdmin.mockResolvedValue(ADMIN_SESSION);
  mockUpdate.mockResolvedValue({} as any);
  mockDelete.mockResolvedValue({} as any);
});

describe("approveUserAction", () => {
  it("sets status to ACTIVE for the given user", async () => {
    await approveUserAction("user123");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: { status: "ACTIVE" },
    });
  });

  it("enforces admin-only access", async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error("REDIRECT:/403"));
    await expect(approveUserAction("user123")).rejects.toThrow("REDIRECT:/403");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns success", async () => {
    const result = await approveUserAction("user123");
    expect(result).toEqual({ success: true });
  });
});

describe("rejectUserAction", () => {
  it("deletes the user record", async () => {
    await rejectUserAction("user456");
    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: "user456" },
    });
  });

  it("enforces admin-only access", async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error("REDIRECT:/403"));
    await expect(rejectUserAction("user456")).rejects.toThrow("REDIRECT:/403");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns success", async () => {
    const result = await rejectUserAction("user456");
    expect(result).toEqual({ success: true });
  });
});
