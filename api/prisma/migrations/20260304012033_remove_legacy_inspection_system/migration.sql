/*
  Warnings:

  - You are about to drop the column `inspectionId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the `Finding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Inspection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Photo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Finding" DROP CONSTRAINT "Finding_inspectionId_fkey";

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_findingId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_inspectionId_fkey";

-- DropIndex
DROP INDEX "Report_inspectionId_idx";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "inspectionId";

-- DropTable
DROP TABLE "Finding";

-- DropTable
DROP TABLE "Inspection";

-- DropTable
DROP TABLE "Photo";

-- DropEnum
DROP TYPE "Status";
