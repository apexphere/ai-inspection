-- CreateEnum
CREATE TYPE "MeasurementType" AS ENUM ('MOISTURE_CONTENT', 'SLOPE_FALL', 'DIMENSION', 'CLEARANCE', 'TEMPERATURE', 'OTHER');

-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('PERCENT', 'MM_PER_M', 'MM', 'CM', 'M', 'CELSIUS');

-- CreateEnum
CREATE TYPE "MeasurementResult" AS ENUM ('PENDING', 'PASS', 'FAIL');

-- CreateTable
CREATE TABLE "SiteMeasurement" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "type" "MeasurementType" NOT NULL,
    "location" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" "MeasurementUnit" NOT NULL,
    "result" "MeasurementResult" NOT NULL DEFAULT 'PENDING',
    "linkedClauseId" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteMeasurement_inspectionId_idx" ON "SiteMeasurement"("inspectionId");

-- CreateIndex
CREATE INDEX "SiteMeasurement_type_idx" ON "SiteMeasurement"("type");

-- AddForeignKey
ALTER TABLE "SiteMeasurement" ADD CONSTRAINT "SiteMeasurement_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SiteInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMeasurement" ADD CONSTRAINT "SiteMeasurement_linkedClauseId_fkey" FOREIGN KEY ("linkedClauseId") REFERENCES "BuildingCodeClause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
