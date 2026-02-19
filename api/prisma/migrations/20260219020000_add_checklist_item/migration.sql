-- CreateEnum
CREATE TYPE "ChecklistCategory" AS ENUM ('EXTERIOR', 'INTERIOR', 'DECKS', 'SERVICES', 'SITE');

-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('PASS', 'FAIL', 'NA');

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "category" "ChecklistCategory" NOT NULL,
    "item" TEXT NOT NULL,
    "decision" "Decision" NOT NULL,
    "notes" TEXT,
    "photoIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChecklistItem_inspectionId_category_idx" ON "ChecklistItem"("inspectionId", "category");

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "SiteInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
