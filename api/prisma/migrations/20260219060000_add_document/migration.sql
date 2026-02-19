-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PS1', 'PS2', 'PS3', 'PS4', 'COC', 'ESC', 'WARRANTY', 'INVOICE', 'DRAWING', 'REPORT', 'FLOOD_TEST', 'PROPERTY_FILE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('REQUIRED', 'RECEIVED', 'OUTSTANDING', 'NA');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "appendixLetter" TEXT,
    "filePath" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "description" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "referenceNumber" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'REQUIRED',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "linkedClauses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
