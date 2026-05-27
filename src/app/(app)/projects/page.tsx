import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ProjectsView } from "@/components/projects/projects-view";

export default async function ProjectsPage() {
  await requireAuth();

  const projects = await prisma.project.findMany({
    orderBy: { startDate: "desc" },
  });

  return (
    <>
      <Header title="Projects" />
      <ProjectsView projects={projects} />
    </>
  );
}
