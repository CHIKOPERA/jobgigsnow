# 01 — Data model

Prisma 7 schema covering all three pipeline stages (sourcing, improving, posting), even though only
posting is read by the UI in Phase 1.

## Checklist
- [x] `Source` — name, baseUrl, crawl strategy/selector config (JSON), cadence, enabled flag, lastRunAt.
- [x] `RawJob` — sourceId, externalId, externalUrl, raw payload (JSON), contentHash, discoveredAt, fetchStatus.
- [x] `Job` — slug, title, company, location, remoteType, employmentType, salary min/max/currency/period,
      description, highlights/tags, applyUrl or native flag, postedAt, closesAt, status.
- [x] `JobStatus` enum: DISCOVERED → IMPROVING → READY → PUBLISHED → CLOSED → ARCHIVED, plus REJECTED.
- [x] `Company` — name, slug, domain, logoUrl (optional).
- [x] `Tag` / `JobTag` join table for skills/facets.
- [x] `SavedJob`, `SavedSearch`, `JobAlert` — keyed by Clerk `userId` string, no local `User` table
      (no profile data needed in Phase 1).
- [x] `ImprovementRun` — audit trail linking RawJob → Job (model, prompt version, diff/token counts,
      status, timestamps). Written by phase 2; defined now.
- [x] Unique constraint `(sourceId, externalId)` on `RawJob` for idempotent ingestion, plus `contentHash`
      index for dedupe.
- [x] Indexes: `Job(status, postedAt)`, `Job(companyId)`, `Job(location)`, `JobTag(tagId)`, and a
      trigram/full-text-friendly index on `Job(title)` (falls back to btree; upgrade to `pg_trgm` GIN
      once search volume warrants it — noted in migration comment).
- [x] `createdAt`/`updatedAt` on every table.
- [x] Migration generated and applied against a local Postgres instance.
- [x] Seed data validates against the schema (see `05-seed-and-tooling.md`).

## Notes
- Prisma 7: generator uses `provider = "prisma-client"` with `output = "../src/generated/prisma"`
  (no more `@prisma/client` import from `node_modules`). Connection URL lives in `prisma.config.ts`,
  not in the `datasource` block.
- `RawJob.payload` and `Source.crawlConfig` are untyped `Json` — phase 2 owns their internal shape.
