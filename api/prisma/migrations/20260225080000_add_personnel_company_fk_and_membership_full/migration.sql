-- AlterTable: Add companyId FK to Personnel (#487)
ALTER TABLE "Personnel" ADD COLUMN "companyId" TEXT;

-- CreateIndex
CREATE INDEX "Personnel_companyId_idx" ON "Personnel"("companyId");

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add membershipFull to Credential (#488)
ALTER TABLE "Credential" ADD COLUMN "membershipFull" TEXT;
