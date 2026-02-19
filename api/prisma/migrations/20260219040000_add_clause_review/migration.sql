-- CreateEnum
CREATE TYPE "Applicability" AS ENUM ('APPLICABLE', 'NA');

-- CreateTable
CREATE TABLE "ClauseReview" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "applicability" "Applicability" NOT NULL,
    "naReason" TEXT,
    "observations" TEXT,
    "photoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "docIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "docsRequired" TEXT,
    "remedialWorks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClauseReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClauseReview_inspectionId_idx" ON "ClauseReview"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClauseReview_inspectionId_clauseId_key" ON "ClauseReview"("inspectionId", "clauseId");

-- AddForeignKey
ALTER TABLE "ClauseReview" ADD CONSTRAINT "ClauseReview_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SiteInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClauseReview" ADD CONSTRAINT "ClauseReview_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "BuildingCodeClause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
