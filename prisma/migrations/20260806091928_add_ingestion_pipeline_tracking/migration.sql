-- CreateEnum
CREATE TYPE "IngestRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "IngestFailureStage" AS ENUM ('DISCOVERY', 'ACQUISITION', 'EXTRACTION', 'AGGREGATION', 'VALIDATION', 'PERSISTENCE');

-- AlterEnum
ALTER TYPE "FetchStatus" ADD VALUE 'FETCHING';

-- AlterTable
ALTER TABLE "RawJob" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aggregationClaimedAt" TIMESTAMP(3),
ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "consecutiveMissingRuns" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extractionVersion" TEXT,
ADD COLUMN     "httpStatus" INTEGER,
ADD COLUMN     "ingestRunId" TEXT,
ADD COLUMN     "lastChangedAt" TIMESTAMP(3),
ADD COLUMN     "lastCrawledAt" TIMESTAMP(3),
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "needsAggregation" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "IngestRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "IngestRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "discoveredCount" INTEGER NOT NULL DEFAULT 0,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "changedCount" INTEGER NOT NULL DEFAULT 0,
    "unchangedCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "inactiveCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "validationFailedCount" INTEGER NOT NULL DEFAULT 0,
    "aiFailedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestFailure" (
    "id" TEXT NOT NULL,
    "ingestRunId" TEXT NOT NULL,
    "rawJobId" TEXT,
    "stage" "IngestFailureStage" NOT NULL,
    "url" TEXT,
    "message" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestRun_sourceId_startedAt_idx" ON "IngestRun"("sourceId", "startedAt");

-- CreateIndex
CREATE INDEX "IngestRun_status_idx" ON "IngestRun"("status");

-- CreateIndex
CREATE INDEX "IngestFailure_ingestRunId_idx" ON "IngestFailure"("ingestRunId");

-- CreateIndex
CREATE INDEX "IngestFailure_rawJobId_idx" ON "IngestFailure"("rawJobId");

-- CreateIndex
CREATE INDEX "IngestFailure_stage_idx" ON "IngestFailure"("stage");

-- CreateIndex
CREATE INDEX "RawJob_sourceId_active_idx" ON "RawJob"("sourceId", "active");

-- CreateIndex
CREATE INDEX "RawJob_fetchStatus_needsAggregation_idx" ON "RawJob"("fetchStatus", "needsAggregation");

-- CreateIndex
CREATE INDEX "RawJob_ingestRunId_idx" ON "RawJob"("ingestRunId");

-- AddForeignKey
ALTER TABLE "RawJob" ADD CONSTRAINT "RawJob_ingestRunId_fkey" FOREIGN KEY ("ingestRunId") REFERENCES "IngestRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestRun" ADD CONSTRAINT "IngestRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestFailure" ADD CONSTRAINT "IngestFailure_ingestRunId_fkey" FOREIGN KEY ("ingestRunId") REFERENCES "IngestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestFailure" ADD CONSTRAINT "IngestFailure_rawJobId_fkey" FOREIGN KEY ("rawJobId") REFERENCES "RawJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
