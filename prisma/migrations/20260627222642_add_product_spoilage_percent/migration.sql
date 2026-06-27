/*
  Warnings:

  - You are about to drop the column `productionRunId` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the `ProductionRun` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductionRun" DROP CONSTRAINT "ProductionRun_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_productionRunId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "spoilagePercent" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "productionRunId";

-- DropTable
DROP TABLE "ProductionRun";
