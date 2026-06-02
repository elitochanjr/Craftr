import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Require an authenticated session. Redirects to /sign-in if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (session.user.status === "PENDING") redirect("/pending-approval");
  if (session.user.status === "INACTIVE") redirect("/sign-in");
  return session;
}

/**
 * Require an ADMIN session. Redirects to /sign-in if unauthenticated,
 * or /403 if authenticated but not ADMIN.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") redirect("/403");
  return session;
}
