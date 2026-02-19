-- CreateEnum
CREATE TYPE "BuildingHistoryType" AS ENUM ('BUILDING_PERMIT', 'BUILDING_CONSENT', 'CCC', 'COA', 'RESOURCE_CONSENT', 'OTHER');

-- CreateEnum
CREATE TYPE "BuildingHistoryStatus" AS ENUM ('ISSUED', 'LAPSED', 'CANCELLED', 'COMPLETE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "BuildingHistory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "BuildingHistoryType" NOT NULL,
    "reference" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "BuildingHistoryStatus" NOT NULL DEFAULT 'UNKNOWN',
    "description" TEXT,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildingHistory_propertyId_idx" ON "BuildingHistory"("propertyId");

-- CreateIndex
CREATE INDEX "BuildingHistory_type_idx" ON "BuildingHistory"("type");

-- AddForeignKey
ALTER TABLE "BuildingHistory" ADD CONSTRAINT "BuildingHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
