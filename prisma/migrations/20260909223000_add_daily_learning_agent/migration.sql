-- Add durable daily-goal and learning state.
CREATE TYPE "AgentRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "AgentInsightKind" AS ENUM ('TRAFFIC', 'CATEGORY', 'SOURCE', 'CONTENT', 'SPEED', 'SYSTEM');
CREATE TYPE "AgentInsightStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'DISMISSED');
CREATE TYPE "AgentExperimentStatus" AS ENUM ('PROPOSED', 'RUNNING', 'KEPT', 'REVERTED', 'CANCELLED');

ALTER TABLE "Source"
ADD COLUMN "agentPriority" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "agentReason" TEXT;

ALTER TABLE "Job"
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "indexingNotifiedAt" TIMESTAMP(3),
ADD COLUMN "indexingRemovedAt" TIMESTAMP(3);

UPDATE "Job"
SET "publishedAt" = COALESCE("postedAt", "createdAt")
WHERE "status" = 'PUBLISHED' AND "publishedAt" IS NULL;

ALTER TABLE "AdminSetting"
ADD COLUMN "agentEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "dailyViewGoal" INTEGER NOT NULL DEFAULT 300,
ADD COLUMN "dailyPublishMin" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "dailyPublishMax" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN "categoryMinimum" INTEGER NOT NULL DEFAULT 5;

CREATE TABLE "DailyAgentRun" (
  "id" TEXT NOT NULL,
  "runKey" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "workflowRunId" TEXT,
  "status" "AgentRunStatus" NOT NULL DEFAULT 'RUNNING',
  "currentStage" TEXT,
  "summary" JSONB,
  "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyAgentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailySiteMetric" (
  "dateKey" TEXT NOT NULL,
  "measuredDate" TEXT,
  "pageViews" INTEGER,
  "activeUsers" INTEGER,
  "engagedSessions" INTEGER,
  "searchClicks" DOUBLE PRECISION,
  "searchImpressions" DOUBLE PRECISION,
  "searchCtr" DOUBLE PRECISION,
  "searchPosition" DOUBLE PRECISION,
  "applyClicks" INTEGER,
  "savedJobs" INTEGER NOT NULL DEFAULT 0,
  "publishedJobs" INTEGER NOT NULL DEFAULT 0,
  "categoryCounts" JSONB NOT NULL,
  "topPages" JSONB,
  "sourceScores" JSONB,
  "speed" JSONB,
  "integrations" JSONB NOT NULL,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailySiteMetric_pkey" PRIMARY KEY ("dateKey")
);

CREATE TABLE "AgentInsight" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "kind" "AgentInsightKind" NOT NULL,
  "status" "AgentInsightStatus" NOT NULL DEFAULT 'ACTIVE',
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "action" TEXT,
  "evidence" JSONB,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "AgentInsight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentExperiment" (
  "id" TEXT NOT NULL,
  "hypothesis" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "change" TEXT NOT NULL,
  "status" "AgentExperimentStatus" NOT NULL DEFAULT 'PROPOSED',
  "baseline" JSONB,
  "result" JSONB,
  "decision" TEXT,
  "startedAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentExperiment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyAgentRun_runKey_key" ON "DailyAgentRun"("runKey");
CREATE INDEX "DailyAgentRun_dateKey_startedAt_idx" ON "DailyAgentRun"("dateKey", "startedAt");
CREATE INDEX "DailyAgentRun_status_idx" ON "DailyAgentRun"("status");
CREATE UNIQUE INDEX "AgentInsight_fingerprint_key" ON "AgentInsight"("fingerprint");
CREATE INDEX "AgentInsight_status_lastSeenAt_idx" ON "AgentInsight"("status", "lastSeenAt");
CREATE INDEX "AgentInsight_kind_lastSeenAt_idx" ON "AgentInsight"("kind", "lastSeenAt");
CREATE INDEX "AgentExperiment_status_createdAt_idx" ON "AgentExperiment"("status", "createdAt");
CREATE INDEX "Job_publishedAt_idx" ON "Job"("publishedAt");
