-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('IMMEDIATE_ATTENTION', 'FURTHER_INVESTIGATION', 'MONITOR', 'NO_ACTION');

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN     "floorPlanId" TEXT,
ADD COLUMN     "room" TEXT,
ADD COLUMN     "severity" "FindingSeverity";

-- AlterTable
ALTER TABLE "MoistureReading" ADD COLUMN     "meterModel" TEXT,
ADD COLUMN     "meterReading" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "buildingType" TEXT,
ADD COLUMN     "parking" TEXT,
ADD COLUMN     "storeys" INTEGER;

-- AlterTable
ALTER TABLE "SiteInspection" ADD COLUMN     "rainfallLast3Days" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "FloorPlan" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "label" TEXT,
    "rooms" TEXT[],
    "photoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionSectionConclusion" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionSectionConclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorLevelSurvey" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "maxDeviation" DOUBLE PRECISION,
    "withinTolerance" BOOLEAN,
    "notes" TEXT,
    "photoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorLevelSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThermalImagingRecord" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "floor" INTEGER,
    "anomalyFound" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "photoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThermalImagingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FloorPlan_inspectionId_idx" ON "FloorPlan"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "FloorPlan_inspectionId_floor_key" ON "FloorPlan"("inspectionId", "floor");

-- CreateIndex
CREATE INDEX "InspectionSectionConclusion_inspectionId_idx" ON "InspectionSectionConclusion"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionSectionConclusion_inspectionId_section_key" ON "InspectionSectionConclusion"("inspectionId", "section");

-- CreateIndex
CREATE INDEX "FloorLevelSurvey_inspectionId_idx" ON "FloorLevelSurvey"("inspectionId");

-- CreateIndex
CREATE INDEX "ThermalImagingRecord_inspectionId_idx" ON "ThermalImagingRecord"("inspectionId");

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlan" ADD CONSTRAINT "FloorPlan_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SiteInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionSectionConclusion" ADD CONSTRAINT "InspectionSectionConclusion_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SiteInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorLevelSurvey" ADD CONSTRAINT "FloorLevelSurvey_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SiteInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThermalImagingRecord" ADD CONSTRAINT "ThermalImagingRecord_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SiteInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
