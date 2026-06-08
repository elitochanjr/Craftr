import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export default function Loading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-48" />
      {/* Hero row */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      {/* Notes */}
      <Skeleton className="h-16 w-full" />
      {/* Table header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="rounded-lg border border-border overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-border last:border-0 flex gap-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
