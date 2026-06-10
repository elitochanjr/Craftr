"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/generated/prisma/client";
import { createProductAction } from "@/app/(app)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Plus, Package2 } from "lucide-react";

interface ProductsViewProps {
  products: Product[];
  role: string;
}

export function ProductsView({ products, role }: ProductsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");

  const isAdmin = role === "ADMIN";

  function openCreate() {
    setName("");
    setError(null);
    setCreateOpen(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await createProductAction(name);
      if (res.error) {
        setError(res.error);
      } else {
        setCreateOpen(false);
        router.push(`/products/${res.id}`);
      }
    });
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Products</h2>
            <p className="text-sm text-muted-foreground">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              New product
            </Button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">No products yet</p>
            <p className="text-xs text-muted-foreground">
              Track finished goods you make and sell.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/products/${p.id}`)}
              >
                <p className="text-sm font-medium truncate">{p.name}</p>
                <span className="text-sm text-muted-foreground shrink-0 ml-4">
                  {p.stockQuantity} in stock
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create sheet ───────────────────────────────────────────── */}
      <Sheet open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New product</SheetTitle>
          </SheetHeader>
          <div className="px-4 py-4 space-y-4 flex-1">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">Name *</Label>
              <Input
                id="prod-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hand-bound journal"
                autoFocus
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1"
            >
              Create product
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
