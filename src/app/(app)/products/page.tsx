import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ProductsView } from "@/components/products/products-view";
import Link from "next/link";
import { Wrench, ChevronRight } from "lucide-react";

export default async function ProductsPage() {
  const session = await requireAuth();

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Header title="Products" />
      <ProductsView products={products} role={session.user.role} />

      {/* Sub-navigation */}
      <div className="px-6 pb-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Related
          </p>
          <Link
            href="/products/overhead"
            className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Overhead Items</p>
                <p className="text-xs text-muted-foreground">
                  Equipment and tools with a fixed cost per use
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </>
  );
}
