-- Rename ReportStatus enum values for report workflow (#210)
-- REVIEW → IN_REVIEW, GENERATED → FINALIZED

ALTER TYPE "ReportStatus" RENAME VALUE 'REVIEW' TO 'IN_REVIEW';
ALTER TYPE "ReportStatus" RENAME VALUE 'GENERATED' TO 'FINALIZED';
