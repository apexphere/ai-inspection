-- CreateEnum
CREATE TYPE "ReviewCommentPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReviewCommentStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "section" TEXT,
    "content" TEXT NOT NULL,
    "priority" "ReviewCommentPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ReviewCommentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewComment_reportId_idx" ON "ReviewComment"("reportId");

-- CreateIndex
CREATE INDEX "ReviewComment_reportId_status_idx" ON "ReviewComment"("reportId", "status");

-- CreateIndex
CREATE INDEX "ReviewComment_authorId_idx" ON "ReviewComment"("authorId");

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
