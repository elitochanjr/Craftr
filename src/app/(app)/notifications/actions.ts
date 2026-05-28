"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export type NotificationRow = {
  id: string;
  message: string;
  createdAt: Date;
  item: { id: string; name: string } | null;
};

export async function getNotificationsAction(): Promise<NotificationRow[]> {
  const session = await requireAuth();
  return prisma.notification.findMany({
    where: { userId: session.user.id, read: false },
    select: {
      id: true,
      message: true,
      createdAt: true,
      item: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const session = await requireAuth();
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/");
}

export async function markAllReadAction(): Promise<void> {
  const session = await requireAuth();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/");
}
