import { requireAuth } from "@/lib/auth-helpers";
import { Header } from "@/components/layout/header";
import { ReportsView } from "@/components/reports/reports-view";
import {
  getLowStockItems,
  getCostPerOrder,
  getCostPerProject,
  getInventoryValue,
  getSpendingOverTime,
  getTopUsedItems,
} from "@/lib/report-queries";

export default async function ReportsPage() {
  await requireAuth();

  const [lowStock, costPerOrder, costPerProject, inventoryValue, spending, topUsed] =
    await Promise.all([
      getLowStockItems(),
      getCostPerOrder(),
      getCostPerProject(),
      getInventoryValue(),
      getSpendingOverTime(),
      getTopUsedItems(),
    ]);

  return (
    <>
      <Header title="Reports" />
      <ReportsView
        lowStock={lowStock}
        costPerOrder={costPerOrder}
        costPerProject={costPerProject}
        inventoryValue={inventoryValue}
        spending={spending}
        topUsed={topUsed}
      />
    </>
  );
}
