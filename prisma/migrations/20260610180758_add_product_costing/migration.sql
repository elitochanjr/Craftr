-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "finalRetailPrice" DOUBLE PRECISION,
ADD COLUMN     "generalExpensesPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "laborRatePerHour" DOUBLE PRECISION,
ADD COLUMN     "laborTimeMinutes" DOUBLE PRECISION,
ADD COLUMN     "markupPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "outputPieces" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "taxEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProductMaterial" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProductMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOverhead" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "overheadItemId" TEXT NOT NULL,

    CONSTRAINT "ProductOverhead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductMaterial_productId_itemId_key" ON "ProductMaterial"("productId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOverhead_productId_overheadItemId_key" ON "ProductOverhead"("productId", "overheadItemId");

-- AddForeignKey
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOverhead" ADD CONSTRAINT "ProductOverhead_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOverhead" ADD CONSTRAINT "ProductOverhead_overheadItemId_fkey" FOREIGN KEY ("overheadItemId") REFERENCES "OverheadItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
