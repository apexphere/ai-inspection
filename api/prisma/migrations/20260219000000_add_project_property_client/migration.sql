-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('COA', 'CCC_GAP', 'PPI', 'SAFE_SANITARY', 'TFA');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TerritorialAuthority" AS ENUM ('AKL', 'WCC', 'CCC', 'HDC', 'TCC', 'DCC', 'HCC', 'PCC', 'NCC', 'ICC', 'NPDC', 'WDC', 'RDC', 'OTHER');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "address" TEXT,
    "contactPerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "suburb" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "lotDp" TEXT,
    "councilPropertyId" TEXT,
    "territorialAuthority" "TerritorialAuthority" NOT NULL,
    "bcNumber" TEXT,
    "yearBuilt" INTEGER,
    "siteData" JSONB,
    "construction" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "propertyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_jobNumber_key" ON "Project"("jobNumber");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
