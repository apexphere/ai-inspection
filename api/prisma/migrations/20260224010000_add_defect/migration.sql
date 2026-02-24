-- CreateEnum: BuildingElement
CREATE TYPE "BuildingElement" AS ENUM ('ROOF', 'WALL', 'WINDOW', 'DOOR', 'DECK', 'BALCONY', 'CLADDING', 'FOUNDATION', 'FLOOR', 'CEILING', 'PLUMBING', 'ELECTRICAL', 'INSULATION', 'DRAINAGE', 'STRUCTURE', 'OTHER');

-- CreateEnum: DefectPriority
CREATE TYPE "DefectPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateTable: Defect — Issue #218
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "defectNumber" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "element" "BuildingElement" NOT NULL,
    "description" TEXT NOT NULL,
    "cause" TEXT,
    "remedialAction" TEXT,
    "priority" "DefectPriority" NOT NULL DEFAULT 'MEDIUM',
    "linkedClauseId" TEXT,
    "photoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Defect_inspectionId_defectNumber_key" ON "Defect"("inspectionId", "defectNumber");

-- CreateIndex
CREATE INDEX "Defect_inspectionId_idx" ON "Defect"("inspectionId");

-- CreateIndex
CREATE INDEX "Defect_element_idx" ON "Defect"("element");

-- CreateIndex
CREATE INDEX "Defect_priority_idx" ON "Defect"("priority");

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SiteInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_linkedClauseId_fkey" FOREIGN KEY ("linkedClauseId") REFERENCES "BuildingCodeClause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
