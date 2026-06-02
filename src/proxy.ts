import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/accept-invite", "/pending-approval"];

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth?.user;
  const isSignIn = nextUrl.pathname === "/sign-in";
  const isPendingApproval = nextUrl.pathname === "/pending-approval";
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  // PENDING sessions can only access /pending-approval
  if (isAuthenticated && req.auth?.user?.status === "PENDING" && !isPendingApproval) {
    return NextResponse.redirect(new URL("/pending-approval", nextUrl));
  }

  // Already on sign-in and authenticated → go home
  if (isAuthenticated && isSignIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Not authenticated and not on a public path → redirect to sign-in
  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Protect all paths except static files and API auth callback
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api/auth).*)",
  ],
};
