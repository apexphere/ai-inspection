-- CreateTable
CREATE TABLE "NAReasonTemplate" (
    "id" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "usage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NAReasonTemplate_pkey" PRIMARY KEY ("id")
);
