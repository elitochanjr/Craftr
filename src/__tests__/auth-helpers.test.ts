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

  it("returns session when authenticated", async () => {
    const session = {
      user: { id: "u1", email: "admin@test.com", role: "ADMIN" as const },
      expires: "2099-01-01",
    };
    mockAuth.mockResolvedValueOnce(session as any);
    const result = await requireAuth();
    expect(result).toEqual(session);
  });
});

describe("requireAdmin", () => {
  it("redirects to /403 for STAFF users", async () => {
    const session = {
      user: { id: "u2", email: "staff@test.com", role: "STAFF" as const },
      expires: "2099-01-01",
    };
    mockAuth.mockResolvedValueOnce(session as any);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/403");
    expect(mockRedirect).toHaveBeenCalledWith("/403");
  });

  it("returns session for ADMIN users", async () => {
    const session = {
      user: { id: "u1", email: "admin@test.com", role: "ADMIN" as const },
      expires: "2099-01-01",
    };
    mockAuth.mockResolvedValueOnce(session as any);
    const result = await requireAdmin();
    expect(result).toEqual(session);
  });
});
