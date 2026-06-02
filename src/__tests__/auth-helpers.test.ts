import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth and navigation before importing helpers
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const mockRedirect = vi.mocked(redirect);
const mockAuth = vi.mocked(auth);

beforeEach(() => {
  vi.clearAllMocks();
  // redirect() in Next.js throws internally; simulate that
  mockRedirect.mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
});

describe("requireAuth", () => {
  it("redirects to /sign-in when session is null", async () => {
    mockAuth.mockResolvedValueOnce(null);
    await expect(requireAuth()).rejects.toThrow("REDIRECT:/sign-in");
    expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
  });

  it("returns session when ACTIVE", async () => {
    const session = {
      user: { id: "u1", email: "admin@test.com", role: "ADMIN" as const, status: "ACTIVE" as const },
      expires: "2099-01-01",
    };
    mockAuth.mockResolvedValueOnce(session as any);
    const result = await requireAuth();
    expect(result).toEqual(session);
  });

  it("redirects to /pending-approval for PENDING users", async () => {
    const session = {
      user: { id: "u3", email: "pending@test.com", role: "STAFF" as const, status: "PENDING" as const },
      expires: "2099-01-01",
    };
    mockAuth.mockResolvedValueOnce(session as any);
    await expect(requireAuth()).rejects.toThrow("REDIRECT:/pending-approval");
    expect(mockRedirect).toHaveBeenCalledWith("/pending-approval");
  });

  it("redirects to /sign-in for INACTIVE users", async () => {
    const session = {
      user: { id: "u4", email: "inactive@test.com", role: "STAFF" as const, status: "INACTIVE" as const },
      expires: "2099-01-01",
    };
    mockAuth.mockResolvedValueOnce(session as any);
    await expect(requireAuth()).rejects.toThrow("REDIRECT:/sign-in");
    expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
  });
});

describe("requireAdmin", () => {
  it("redirects to /403 for STAFF users", async () => {
    const session = {
      user: { id: "u2", email: "staff@test.com", role: "STAFF" as const, status: "ACTIVE" as const },
      expires: "2099-01-01",
    };
    mockAuth.mockResolvedValueOnce(session as any);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/403");
    expect(mockRedirect).toHaveBeenCalledWith("/403");
  });

  it("returns session for ADMIN users", async () => {
    const session = {
      user: { id: "u1", email: "admin@test.com", role: "ADMIN" as const, status: "ACTIVE" as const },
      expires: "2099-01-01",
    };
    mockAuth.mockResolvedValueOnce(session as any);
    const result = await requireAdmin();
    expect(result).toEqual(session);
  });
});
