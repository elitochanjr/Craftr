"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { sendInvitationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import type { Role } from "@/generated/prisma/client";
import { randomUUID } from "crypto";

const INVITE_EXPIRY_DAYS = 7;

export async function inviteUserAction(email: string, role: Role) {
  const session = await requireAdmin();
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: "Email is required." };

  // Check not already a user
  const existing = await prisma.user.findUnique({ where: { email: trimmed } });
  if (existing) return { error: "A user with that email already exists." };

  // Upsert invitation (replace expired/existing)
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  await prisma.invitation.upsert({
    where: { email: trimmed },
    create: { email: trimmed, role, token, expiresAt, accepted: false },
    update: { role, token, expiresAt, accepted: false },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

  await sendInvitationEmail(trimmed, inviteUrl);

  console.log(
    `[invite] ${session.user.email} invited ${trimmed} as ${role}. Link: ${inviteUrl}`
  );

  revalidatePath("/settings/users");
  return { success: true };
}

export async function updateUserRoleAction(userId: string, role: Role) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/settings/users");
  return { success: true };
}

export async function deactivateUserAction(userId: string) {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    return { error: "You cannot deactivate your own account." };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { status: "INACTIVE" },
  });
  revalidatePath("/settings/users");
  return { success: true };
}

export async function reactivateUserAction(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/settings/users");
  return { success: true };
}

export async function revokeInvitationAction(invitationId: string) {
  await requireAdmin();
  await prisma.invitation.delete({ where: { id: invitationId } });
  revalidatePath("/settings/users");
  return { success: true };
}
