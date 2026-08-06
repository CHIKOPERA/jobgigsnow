-- Trigram search support for the job list query's `q` filter (title/description).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Job_title_trgm_idx" ON "Job" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Job_description_trgm_idx" ON "Job" USING GIN ("description" gin_trgm_ops);
