"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";

export async function acceptInviteAction(
  token: string,
  name: string,
  password: string
) {
  if (!token) return { error: "Invalid invitation link." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) return { error: "Invitation not found." };
  if (invitation.accepted) return { error: "This invitation has already been used." };
  if (invitation.expiresAt < new Date())
    return { error: "This invitation has expired. Ask an admin to re-invite you." };

  const existing = await prisma.user.findUnique({
    where: { email: invitation.email },
  });
  if (existing) return { error: "An account with this email already exists." };

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        email: invitation.email,
        name: name.trim() || undefined,
        role: invitation.role,
        hashedPassword,
        status: "ACTIVE",
      },
    }),
    prisma.invitation.update({
      where: { token },
      data: { accepted: true },
    }),
  ]);

  // Auto sign-in
  await signIn("credentials", {
    email: invitation.email,
    password,
    redirectTo: "/",
  });

  return { success: true };
}
