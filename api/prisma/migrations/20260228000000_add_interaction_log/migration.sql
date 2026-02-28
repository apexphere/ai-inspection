-- CreateEnum
CREATE TYPE "InteractionEventType" AS ENUM ('USER_INPUT', 'AI_INTERPRETATION', 'TOOL_CALL', 'TOOL_RESULT', 'AI_RESPONSE');

-- CreateTable
CREATE TABLE "InteractionLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "InteractionEventType" NOT NULL,
    "content" JSONB NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "InteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InteractionLog_sessionId_idx" ON "InteractionLog"("sessionId");

-- CreateIndex
CREATE INDEX "InteractionLog_timestamp_idx" ON "InteractionLog"("timestamp");

-- CreateIndex
CREATE INDEX "InteractionLog_sessionId_timestamp_idx" ON "InteractionLog"("sessionId", "timestamp");
