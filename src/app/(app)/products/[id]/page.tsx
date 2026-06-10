import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { Header } from "@/components/layout/header";
import { ProductDetail } from "@/components/products/product-detail";
import { ProductCosting } from "@/components/products/product-costing";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;

  const [product, items, overheadItems] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        materials: {
          include: {
            item: { select: { id: true, name: true, unit: true, cost: true } },
          },
        },
        overheads: {
          include: {
            overheadItem: { select: { id: true, name: true, costPerUse: true } },
          },
        },
      },
    }),
    prisma.item.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, cost: true },
    }),
    prisma.overheadItem.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, costPerUse: true },
    }),
  ]);

  if (!product) notFound();

  const isAdmin = session.user.role === "ADMIN";

  return (
    <>
      <Header title="Products" />
      <ProductDetail product={product} role={session.user.role} />
      <ProductCosting
        productId={product.id}
        initial={{
          laborRatePerHour: product.laborRatePerHour,
          laborTimeMinutes: product.laborTimeMinutes,
          generalExpensesPercent: product.generalExpensesPercent,
          outputPieces: product.outputPieces,
          taxEnabled: product.taxEnabled,
          markupPercent: product.markupPercent,
          discountPercent: product.discountPercent,
          finalRetailPrice: product.finalRetailPrice,
          materials: product.materials.map((m) => ({
            itemId: m.itemId,
            quantity: m.quantity,
            item: m.item,
          })),
          overheadIds: product.overheads.map((o) => o.overheadItemId),
        }}
        availableItems={items}
        availableOverheads={overheadItems}
        isAdmin={isAdmin}
      />
    </>
  );
}
