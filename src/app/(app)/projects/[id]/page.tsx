import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { Header } from "@/components/layout/header";
import { ProjectDetail } from "@/components/projects/project-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  await requireAuth();
  const { id } = await params;

  const [project, items] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        stockMovements: {
          where: { type: "USAGE" },
          select: { quantity: true, unitCost: true },
        },
      },
    }),
    prisma.item.findMany({
      select: { id: true, name: true, unit: true, cost: true, quantity: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) notFound();

  const totalSupplyCost = project.stockMovements.reduce(
    (sum, m) => sum + Math.abs(m.quantity) * (m.unitCost ?? 0),
    0
  );

  return (
    <>
      <Header title="Projects" />
      <ProjectDetail
        project={{ ...project, totalSupplyCost, stockMovements: undefined }}
        items={items}
      />
    </>
  );
}
