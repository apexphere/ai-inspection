-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('SIMPLE', 'CLAUSE_REVIEW');

-- CreateEnum
CREATE TYPE "InspectionStage" AS ENUM ('INS_01', 'INS_02', 'INS_03', 'INS_04', 'INS_05', 'INS_06', 'INS_07', 'INS_07A', 'INS_08', 'INS_09', 'INS_10', 'INS_11', 'COA', 'CCC_GA', 'S_AND_S', 'TFA', 'DMG');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InspectionOutcome" AS ENUM ('PASS', 'FAIL', 'REPEAT_REQUIRED');

-- CreateTable
CREATE TABLE "SiteInspection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "stage" "InspectionStage" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'DRAFT',
    "weather" TEXT,
    "personsPresent" TEXT,
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "methodology" TEXT,
    "areasNotAccessed" TEXT,
    "inspectorName" TEXT NOT NULL,
    "lbpOnSite" BOOLEAN,
    "lbpLicenseSighted" BOOLEAN,
    "lbpLicenseNumber" TEXT,
    "lbpExpiryDate" TIMESTAMP(3),
    "outcome" "InspectionOutcome",
    "signatureData" TEXT,
    "signatureDate" TIMESTAMP(3),
    "currentSection" TEXT,
    "currentClauseId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteInspection_projectId_idx" ON "SiteInspection"("projectId");

-- CreateIndex
CREATE INDEX "SiteInspection_status_idx" ON "SiteInspection"("status");

-- AddForeignKey
ALTER TABLE "SiteInspection" ADD CONSTRAINT "SiteInspection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
