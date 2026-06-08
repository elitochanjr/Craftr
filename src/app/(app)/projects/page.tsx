import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ProjectsView } from "@/components/projects/projects-view";

export default async function ProjectsPage() {
  await requireAuth();

  const projects = await prisma.project.findMany({
    orderBy: { startDate: "desc" },
    include: {
      stockMovements: {
        where: { type: "USAGE" },
        select: { quantity: true, unitCost: true },
      },
    },
  });

  const projectsWithCost = projects.map((p) => ({
    ...p,
    totalSupplyCost: p.stockMovements.reduce(
      (sum, m) => sum + Math.abs(m.quantity) * (m.unitCost ?? 0),
      0
    ),
    stockMovements: undefined,
  }));

  return (
    <>
      <Header title="Projects" />
      <ProjectsView projects={projectsWithCost} />
    </>
  );
}
