-- AlterEnum
ALTER TYPE "IngestRunStatus" ADD VALUE 'PAUSED';

-- CreateEnum
CREATE TYPE "IngestFailureStatus" AS ENUM ('OPEN', 'RETRYING', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "IngestRun"
ADD COLUMN "currentStage" TEXT,
ADD COLUMN "currentJobTitle" TEXT,
ADD COLUMN "heartbeatAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "IngestFailure"
ADD COLUMN "status" "IngestFailureStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN "resolvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "IngestFailure_status_createdAt_idx" ON "IngestFailure"("status", "createdAt");
