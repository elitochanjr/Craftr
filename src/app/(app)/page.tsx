import { requireAuth } from "@/lib/auth-helpers";
import { Header } from "@/components/layout/header";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/dashboard-queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAuth();
  const data = await getDashboardData();

  return (
    <>
      <Header title="Dashboard" />
      <DashboardView {...data} />
    </>
  );
}
