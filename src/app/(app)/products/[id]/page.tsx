import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { Header } from "@/components/layout/header";
import { ProductDetail } from "@/components/products/product-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) notFound();

  return (
    <>
      <Header title="Products" />
      <ProductDetail product={product} role={session.user.role} />
    </>
  );
}
