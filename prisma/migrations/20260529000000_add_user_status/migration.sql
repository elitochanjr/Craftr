-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- AlterTable: add status column with a temporary default
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill: map existing active boolean to the new enum
UPDATE "User" SET "status" = CASE
  WHEN "active" = true THEN 'ACTIVE'::"UserStatus"
  ELSE 'INACTIVE'::"UserStatus"
END;

-- AlterTable: drop the old active column
ALTER TABLE "User" DROP COLUMN "active";
