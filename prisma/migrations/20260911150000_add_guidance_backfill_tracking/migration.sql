CREATE TYPE "ApplicationGuidanceBackfillStatus" AS ENUM ('RUNNING', 'COMPLETED');
CREATE TYPE "ApplicationGuidanceBackfillItemStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

ALTER TABLE "Job" ADD COLUMN "applicationGuidanceGeneratedAt" TIMESTAMP(3);

CREATE TABLE "ApplicationGuidanceBackfillRun" (
  "id" TEXT NOT NULL,
  "status" "ApplicationGuidanceBackfillStatus" NOT NULL DEFAULT 'RUNNING',
  "total" INTEGER NOT NULL,
  "completed" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "currentJobTitle" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationGuidanceBackfillRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationGuidanceBackfillItem" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "status" "ApplicationGuidanceBackfillItemStatus" NOT NULL DEFAULT 'PENDING',
  "error" TEXT,
  "claimedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationGuidanceBackfillItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationGuidanceBackfillRun_status_startedAt_idx" ON "ApplicationGuidanceBackfillRun"("status", "startedAt");
CREATE UNIQUE INDEX "ApplicationGuidanceBackfillItem_runId_jobId_key" ON "ApplicationGuidanceBackfillItem"("runId", "jobId");
CREATE INDEX "ApplicationGuidanceBackfillItem_runId_status_idx" ON "ApplicationGuidanceBackfillItem"("runId", "status");
CREATE INDEX "ApplicationGuidanceBackfillItem_status_claimedAt_idx" ON "ApplicationGuidanceBackfillItem"("status", "claimedAt");

ALTER TABLE "ApplicationGuidanceBackfillItem"
ADD CONSTRAINT "ApplicationGuidanceBackfillItem_runId_fkey"
FOREIGN KEY ("runId") REFERENCES "ApplicationGuidanceBackfillRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationGuidanceBackfillItem"
ADD CONSTRAINT "ApplicationGuidanceBackfillItem_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
