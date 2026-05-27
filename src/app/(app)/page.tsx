import { Header } from "@/components/layout/header";

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold tracking-tight mb-2">
            Today&apos;s Focus
          </h2>
          <p className="text-muted-foreground mb-8">
            Your inventory at a glance.
          </p>

          {/* Placeholder sections — filled in by the Dashboard slice (#20) */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {[
              { label: "Active Orders", value: "—" },
              { label: "Items to Restock", value: "—" },
              { label: "Recent Activity", value: "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border border-border bg-card p-5"
              >
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {label}
                </p>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Dashboard content will populate once you add inventory, log orders, and track usage.
          </p>
        </div>
      </div>
    </>
  );
}
