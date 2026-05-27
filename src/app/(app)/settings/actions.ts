"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const VALID_ACCENTS = ["neutral", "rose", "violet", "blue", "green", "orange"];

export async function saveAccentColorAction(accent: string) {
  if (!VALID_ACCENTS.includes(accent)) return { error: "Invalid accent color." };

  const session = await requireAuth();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { accentColor: accent },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
