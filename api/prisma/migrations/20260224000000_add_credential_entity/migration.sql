-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('NZIBS', 'LBP', 'ENG_NZ', 'ACADEMIC', 'OTHER');

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
CREATE INDEX "Credential_personnelId_idx" ON "Credential"("personnelId");

-- CreateIndex
CREATE INDEX "Credential_expiryDate_idx" ON "Credential"("expiryDate");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "Personnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
