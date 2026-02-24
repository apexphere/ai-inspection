-- CreateEnum
CREATE TYPE "ReportAuditAction" AS ENUM ('CREATED', 'STATUS_CHANGED', 'CONTENT_UPDATED', 'VERSION_CREATED', 'DELETED');

-- CreateTable
CREATE TABLE "ReportAuditLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "action" "ReportAuditAction" NOT NULL,
    "userId" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportAuditLog_reportId_idx" ON "ReportAuditLog"("reportId");

-- CreateIndex
CREATE INDEX "ReportAuditLog_reportId_createdAt_idx" ON "ReportAuditLog"("reportId", "createdAt");

-- AddForeignKey
ALTER TABLE "ReportAuditLog" ADD CONSTRAINT "ReportAuditLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
