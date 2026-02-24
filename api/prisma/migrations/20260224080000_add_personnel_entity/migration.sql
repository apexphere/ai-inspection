-- CreateEnum
CREATE TYPE "PersonnelRole" AS ENUM ('REGISTERED_BUILDING_SURVEYOR', 'BUILDING_SURVEYOR', 'INSPECTOR', 'ADMIN');

-- CreateTable
CREATE TABLE "Personnel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "role" "PersonnelRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Personnel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_email_key" ON "Personnel"("email");

-- CreateIndex
CREATE INDEX "Personnel_role_idx" ON "Personnel"("role");

-- CreateIndex
CREATE INDEX "Personnel_active_idx" ON "Personnel"("active");

-- CreateIndex
CREATE INDEX "Personnel_email_idx" ON "Personnel"("email");
