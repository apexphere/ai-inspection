-- Add WhatsApp linking fields to User — Issue #189

-- Add phoneNumber and phoneVerified to User
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- Create unique index on phoneNumber (allows null)
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- Create index on phoneNumber for lookups
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateTable: WhatsAppVerificationCode
CREATE TABLE "WhatsAppVerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppVerificationCode_userId_idx" ON "WhatsAppVerificationCode"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppVerificationCode_phoneNumber_code_idx" ON "WhatsAppVerificationCode"("phoneNumber", "code");

-- AddForeignKey
ALTER TABLE "WhatsAppVerificationCode" ADD CONSTRAINT "WhatsAppVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
