-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'GENERATED', 'SUBMITTED');

-- AlterTable: make inspectionId and path nullable, add new columns
ALTER TABLE "Report"
  ALTER COLUMN "inspectionId" DROP NOT NULL,
  ALTER COLUMN "path" DROP NOT NULL,
  ADD COLUMN "siteInspectionId" TEXT,
  ADD COLUMN "type"            "ReportType"   NOT NULL DEFAULT 'COA',
  ADD COLUMN "status"          "ReportStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "version"         INTEGER        NOT NULL DEFAULT 1,
  ADD COLUMN "pdfPath"         TEXT,
  ADD COLUMN "pdfSize"         INTEGER,
  ADD COLUMN "generatedAt"     TIMESTAMP(3),
  ADD COLUMN "preparedById"    TEXT,
  ADD COLUMN "reviewedById"    TEXT,
  ADD COLUMN "reviewedAt"      TIMESTAMP(3),
  ADD COLUMN "form9Data"       JSONB,
  ADD COLUMN "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Report_inspectionId_idx"     ON "Report"("inspectionId");
CREATE INDEX "Report_siteInspectionId_idx" ON "Report"("siteInspectionId");
CREATE INDEX "Report_status_idx"           ON "Report"("status");
CREATE INDEX "Report_preparedById_idx"     ON "Report"("preparedById");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_siteInspectionId_fkey"
  FOREIGN KEY ("siteInspectionId") REFERENCES "SiteInspection"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
