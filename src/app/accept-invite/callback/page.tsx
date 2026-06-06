import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AcceptInviteCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [session, { token }] = await Promise.all([auth(), searchParams]);

  if (!session?.user?.email || !token) {
    redirect("/sign-in");
  }

  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation || invitation.expiresAt < new Date()) {
    redirect("/sign-in?error=invalid-invite");
  }

  if (invitation.email !== session.user.email) {
    redirect("/sign-in?error=email-mismatch");
  }

  if (!invitation.accepted) {
    await prisma.$transaction([
      prisma.user.update({
        where: { email: invitation.email },
        data: { status: "ACTIVE", role: invitation.role },
      }),
      prisma.invitation.update({
        where: { token },
        data: { accepted: true },
      }),
    ]);
  }

  redirect("/");
}
