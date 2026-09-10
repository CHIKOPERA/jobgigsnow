ALTER TABLE "Source" ADD COLUMN "agentProfile" JSONB;

ALTER TABLE "DailySiteMetric"
ADD COLUMN "industryCounts" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "provinceCounts" JSONB NOT NULL DEFAULT '{}';
