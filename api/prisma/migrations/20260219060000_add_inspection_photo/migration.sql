-- CreateEnum
CREATE TYPE "PhotoSource" AS ENUM ('SITE', 'OWNER', 'CONTRACTOR');

-- CreateTable
CREATE TABLE "InspectionPhoto" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "inspectionId" TEXT,
    "reportNumber" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "caption" TEXT NOT NULL,
    "source" "PhotoSource" NOT NULL DEFAULT 'SITE',
    "takenAt" TIMESTAMP(3),
    "location" JSONB,
    "linkedClauses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedItemId" TEXT,
    "linkedItemType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspectionPhoto_projectId_idx" ON "InspectionPhoto"("projectId");

-- CreateIndex
CREATE INDEX "InspectionPhoto_inspectionId_idx" ON "InspectionPhoto"("inspectionId");
