# 07 — Daily ingestion pipeline + admin

The crawler/rewriter `06-phase-2-handoff.md` was written for. Discovery, page acquisition, free
extractors (Cheerio/Readability/Turndown/JSON-LD), AI reconciliation, and daily scheduling — built
as extensions around the existing `Source → RawJob → Job` pipeline, not a replacement for it.
Verified end to end against a local fixture page (real discovery → acquisition → AI aggregation →
`Job` creation, plus a second run confirming zero duplicates).

## What's new

- **Schema**: `RawJob` gained tracking fields (`canonicalUrl`, `httpStatus`, `lastSeenAt`,
  `lastCrawledAt`, `consecutiveMissingRuns`, `active`, `needsAggregation`,
  `aggregationClaimedAt`, `extractionVersion`) plus a new `FETCHING` status. New models
  `IngestRun` (one row per source per discovery cycle) and `IngestFailure` (per-URL error detail).
- **Pipeline code**: `src/lib/ingest/` — discovery, acquisition, extractors (`jsonld.ts`,
  `selectors.ts`, `readability.ts`, `markdown.ts`), `reconcile.ts` (deterministic merge by
  preference order), `hash.ts` (change detection), `aggregate.ts`/`aggregate-merge.ts` (AI
  reconciliation via the Vercel AI SDK), `normalize.ts` (→ `JobUpsertInput`), `tick.ts`
  (orchestrator).
- **New endpoints**: `POST/GET /api/ingest/sources` (fills the gap `06-phase-2-handoff.md`
  flagged), `GET /api/cron/tick` (Vercel Cron target), and a full `/api/admin/**` namespace.
- **Admin UI**: `/admin` — dashboard, sources CRUD, run history, a raw-bundle inspector, and a
  failures feed. Gated by Clerk `publicMetadata.role === "admin"`.

## Scheduling

`vercel.json` schedules `/api/cron/tick` every 10 minutes, assuming a Pro-or-higher plan (Hobby
caps cron to once/day and has a lower `maxDuration`). Each tick does a bounded slice of work —
discovery-if-due, drain a small acquisition batch, drain a small aggregation batch — and always
returns within its time budget (`ingest.tickTimeBudgetMs` in `src/config/ingest.ts`). Nothing
relies on in-memory state between invocations; a killed tick just leaves rows for the next one to
pick up. **On Hobby**, change the schedule to once/day (e.g. `"0 3 * * *"`) and raise
`maxDuration` — throughput drops, correctness doesn't change.

**Local testing** — there's no local cron trigger; hit the route manually:
```
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/tick
```

## Granting the first admin

There's no in-app UI for this (chicken-and-egg) — do it once, outside the app:

Clerk Dashboard → Users → select the user → Public metadata → `{"role": "admin"}` → Save. Or via
the Backend API: `PATCH https://api.clerk.com/v1/users/{id}` with `CLERK_SECRET_KEY`, body
`{"public_metadata": {"role": "admin"}}`.

## Known gaps / deliberate v1 simplifications

- **Playwright is not built.** `acquisition.ts` is the deliberate seam for adding a JS-rendering
  fetcher later — nothing downstream depends on how HTML was obtained.
- **Recrawl cadence for change detection is a single global value**
  (`ingest.recrawlAfterMs`), not per-source. Prisma can't compare two dynamic columns
  (`lastCrawledAt` vs. a per-row `cadenceMinutes`) in a `WHERE` clause without raw SQL; a shared
  default was the pragmatic v1 tradeoff.
- **No lease/lock table** for overlapping cron ticks — tolerated, not prevented (same tradeoff the
  existing `/api/ingest/queue` endpoint already accepts for concurrent workers). The
  `FETCHING`/`aggregationClaimedAt` staleness windows shrink the collision cost to "one wasted AI
  call," not a correctness bug.
- **Successful crawls require human approval** (`Job.status = "READY"`) — both first ingestion and
  later material content changes return the RawJob-linked Job to the editorial review queue. Only
  an admin review action promotes it to `PUBLISHED`, and publishing is rejected until a social
  preview image has been saved for the job.
- **AI structured-output schema constraint worth remembering**: providers cap how many
  nullable/union-typed parameters one schema can have (Anthropic's structured output hit this at
  ~16). Prefer named non-nullable fields with a sentinel value (e.g. confidence `0` meaning "no
  support") over `.nullable()` columns when a schema needs many optional fields — nullable unions
  count against the limit, plain typed fields don't, and named fields give the model much
  stronger guidance than a dynamic `z.record()` does (a record schema quietly produced empty/zero
  confidence for every field in testing, even when the page content directly supported them).
