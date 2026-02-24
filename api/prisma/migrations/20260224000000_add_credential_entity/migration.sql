-- CreateEnum
CREATE TYPE "PersonnelRole" AS ENUM ('REGISTERED_BUILDING_SURVEYOR', 'BUILDING_SURVEYOR', 'INSPECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('NZIBS', 'LBP', 'ENG_NZ', 'ACADEMIC', 'OTHER');

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

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "credentialType" "CredentialType" NOT NULL,
    "membershipCode" TEXT,
    "registrationTitle" TEXT,
    "licenseNumber" TEXT,
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "issuedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_email_key" ON "Personnel"("email");

-- CreateIndex
CREATE INDEX "Personnel_role_idx" ON "Personnel"("role");

-- CreateIndex
CREATE INDEX "Personnel_active_idx" ON "Personnel"("active");

-- CreateIndex
CREATE INDEX "Personnel_email_idx" ON "Personnel"("email");

-- CreateIndex
CREATE INDEX "Credential_personnelId_idx" ON "Credential"("personnelId");

-- CreateIndex
CREATE INDEX "Credential_expiryDate_idx" ON "Credential"("expiryDate");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
