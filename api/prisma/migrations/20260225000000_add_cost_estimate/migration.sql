-- CreateTable
CREATE TABLE "CostEstimate" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "contingencyRate" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExGst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostLineItem" (
    "id" TEXT NOT NULL,
    "costEstimateId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CostEstimate_reportId_key" ON "CostEstimate"("reportId");

-- CreateIndex
CREATE INDEX "CostEstimate_reportId_idx" ON "CostEstimate"("reportId");

-- CreateIndex
CREATE INDEX "CostLineItem_costEstimateId_idx" ON "CostLineItem"("costEstimateId");

-- CreateIndex
CREATE INDEX "CostLineItem_category_idx" ON "CostLineItem"("category");

-- AddForeignKey
ALTER TABLE "CostEstimate" ADD CONSTRAINT "CostEstimate_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLineItem" ADD CONSTRAINT "CostLineItem_costEstimateId_fkey" FOREIGN KEY ("costEstimateId") REFERENCES "CostEstimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
