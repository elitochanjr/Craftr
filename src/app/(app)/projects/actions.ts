"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@/generated/prisma/client";

export interface ProjectInput {
  name: string;
  status: ProjectStatus;
  startDate: string; // ISO date string
  endDate?: string;
  notes?: string;
}

export async function createProjectAction(input: ProjectInput) {
  await requireAuth();
  if (!input.name.trim()) return { error: "Project name is required." };

  const project = await prisma.project.create({
    data: {
      name: input.name.trim(),
      status: input.status,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/projects");
  return { success: true, id: project.id };
}

export async function updateProjectAction(id: string, input: ProjectInput) {
  await requireAuth();
  if (!input.name.trim()) return { error: "Project name is required." };

  await prisma.project.update({
    where: { id },
    data: {
      name: input.name.trim(),
      status: input.status,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

export async function deleteProjectAction(id: string) {
  await requireAuth();
  // StockMovements will be set to null (onDelete: SetNull in schema)
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}
