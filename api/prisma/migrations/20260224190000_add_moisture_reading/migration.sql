-- Fix: Add missing closing brace to GenerationJobStatus enum
-- (from Taylor's PR #450 merge — cosmetic SQL no-op, schema only)

-- CreateEnum
CREATE TYPE "MoistureResult" AS ENUM ('PENDING', 'ACCEPTABLE', 'MARGINAL', 'UNACCEPTABLE');

-- CreateTable
CREATE TABLE "MoistureReading" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "substrate" TEXT,
    "reading" DOUBLE PRECISION NOT NULL,
    "depth" DOUBLE PRECISION,
    "result" "MoistureResult" NOT NULL DEFAULT 'PENDING',
    "defectId" TEXT,
    "linkedClauseId" TEXT,
    "notes" TEXT,
    "takenAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoistureReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MoistureReading_inspectionId_idx" ON "MoistureReading"("inspectionId");

-- CreateIndex
CREATE INDEX "MoistureReading_result_idx" ON "MoistureReading"("result");

-- CreateIndex
CREATE INDEX "MoistureReading_defectId_idx" ON "MoistureReading"("defectId");

-- AddForeignKey
ALTER TABLE "MoistureReading" ADD CONSTRAINT "MoistureReading_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SiteInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoistureReading" ADD CONSTRAINT "MoistureReading_defectId_fkey" FOREIGN KEY ("defectId") REFERENCES "Defect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoistureReading" ADD CONSTRAINT "MoistureReading_linkedClauseId_fkey" FOREIGN KEY ("linkedClauseId") REFERENCES "BuildingCodeClause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
