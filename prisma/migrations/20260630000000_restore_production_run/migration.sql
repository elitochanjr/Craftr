-- Restore ProductionRun table and StockMovement.productionRunId
-- Both were accidentally dropped by add_product_spoilage_percent migration
-- Uses IF NOT EXISTS so it is safe to run even if already applied manually

CREATE TABLE IF NOT EXISTS "ProductionRun" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "piecesProduced" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionRun_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StockMovement" ADD COLUMN IF NOT EXISTS "productionRunId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductionRun_productId_fkey'
  ) THEN
    ALTER TABLE "ProductionRun" ADD CONSTRAINT "ProductionRun_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StockMovement_productionRunId_fkey'
  ) THEN
    ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productionRunId_fkey"
      FOREIGN KEY ("productionRunId") REFERENCES "ProductionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
