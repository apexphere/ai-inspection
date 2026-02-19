-- CreateEnum
CREATE TYPE "ClauseCategory" AS ENUM ('B', 'C', 'D', 'E', 'F', 'G', 'H');

-- CreateEnum
CREATE TYPE "DurabilityPeriod" AS ENUM ('FIFTY_YEARS', 'FIFTEEN_YEARS', 'FIVE_YEARS', 'NA');

-- CreateTable
CREATE TABLE "BuildingCodeClause" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ClauseCategory" NOT NULL,
    "objective" TEXT,
    "functionalReq" TEXT,
    "performanceText" TEXT NOT NULL,
    "durabilityPeriod" "DurabilityPeriod",
    "typicalEvidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingCodeClause_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuildingCodeClause_code_key" ON "BuildingCodeClause"("code");

-- CreateIndex
CREATE INDEX "BuildingCodeClause_category_idx" ON "BuildingCodeClause"("category");

-- CreateIndex
CREATE INDEX "BuildingCodeClause_parentId_idx" ON "BuildingCodeClause"("parentId");

-- AddForeignKey
ALTER TABLE "BuildingCodeClause" ADD CONSTRAINT "BuildingCodeClause_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BuildingCodeClause"("id") ON DELETE SET NULL ON UPDATE CASCADE;
