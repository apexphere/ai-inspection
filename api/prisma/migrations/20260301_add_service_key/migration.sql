-- CreateTable: ServiceKey — Issue #594
CREATE TABLE "ServiceKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "actor" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceKey_name_key" ON "ServiceKey"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceKey_keyHash_key" ON "ServiceKey"("keyHash");

-- CreateIndex
CREATE INDEX "ServiceKey_keyPrefix_idx" ON "ServiceKey"("keyPrefix");
