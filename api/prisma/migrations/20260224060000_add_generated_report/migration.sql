-- CreateTable: GeneratedReport (#226)
CREATE TABLE "GeneratedReport" (
    "id"          TEXT NOT NULL,
    "reportId"    TEXT NOT NULL,
    "format"      TEXT NOT NULL,
    "filename"    TEXT NOT NULL,
    "r2Key"       TEXT,
    "localPath"   TEXT,
    "fileSize"    INTEGER,
    "pageCount"   INTEGER,
    "photoCount"  INTEGER,
    "version"     INTEGER NOT NULL DEFAULT 1,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedReport_reportId_idx" ON "GeneratedReport"("reportId");

-- AddForeignKey
ALTER TABLE "GeneratedReport" ADD CONSTRAINT "GeneratedReport_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
