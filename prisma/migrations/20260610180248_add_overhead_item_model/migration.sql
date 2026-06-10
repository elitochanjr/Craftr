-- CreateTable
CREATE TABLE "OverheadItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "costPerUse" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OverheadItem_pkey" PRIMARY KEY ("id")
);
