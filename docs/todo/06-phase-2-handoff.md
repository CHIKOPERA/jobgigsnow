# 06 — Phase 2 handoff

How a crawler (sourcing) and a rewriter (improving) plug into what Phase 1 built, with **no UI or
schema changes required**. Everything below is already implemented and working against the real
schema in `prisma/schema.prisma`.

## The pipeline, end to end

```
Source ──(crawl)──▶ RawJob ──(rewrite)──▶ Job.status: DISCOVERED → IMPROVING → READY → PUBLISHED
```

The public UI only ever queries `Job` rows with `status = PUBLISHED`. Every other status is
invisible to job-seekers but fully queryable via the ingestion API, so a phase-2 worker can inspect
its own backlog without touching the database directly.

## Auth: one bearer token, not Clerk

All three ingestion endpoints require:

```
Authorization: Bearer <INGEST_SERVICE_TOKEN>
```

`INGEST_SERVICE_TOKEN` is a single shared secret from env (`src/config/ingest.ts` /
`src/lib/ingest-auth.ts`), the same for every phase-2 worker. It has nothing to do with Clerk —
Clerk is scoped to job-seeker features only (saved jobs/searches/alerts). Missing or wrong token →
`401 { "error": { "code": "UNAUTHORIZED", ... } }`.

## Step 1 — Sourcing: register a `Source`, then post `RawJob`s

There's no ingestion endpoint for creating a `Source` itself in Phase 1 (only ~1 was seeded for the
pipeline demo) — insert rows into `Source` directly (Prisma Studio, a migration, or a small script)
until phase 2 needs a dedicated endpoint. Each `Source` row is just `{ name, baseUrl, crawlConfig
(Json — your crawler owns its shape), cadenceMinutes, enabled, lastRunAt }`.

Once you have a `sourceId`, a crawler run posts discovered jobs:

```
POST /api/ingest/raw-jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "sourceId": "<Source.id>",
  "jobs": [
    {
      "externalId": "nw-8842",              // the source site's own job ID
      "externalUrl": "https://.../jobs/8842",
      "rawTitle": "Forklift Operator Needed ASAP",
      "rawCompany": "Northwind Logistics",
      "rawLocation": "Austin TX",
      "payload": { "...": "whatever your crawler scraped, any JSON shape" },
      "contentHash": "sha256-of-the-payload",
      "fetchStatus": "FETCHED"               // or "FAILED" if the crawl itself errored
    }
  ]
}
```

- **Idempotency**: upserted on `(sourceId, externalId)` — re-crawling the same job overwrites the
  row instead of duplicating it. Re-run your crawler on a schedule freely.
- **Change detection**: `contentHash` isn't enforced by a DB constraint — compute it the same way
  every time (e.g. `sha256(JSON.stringify(payload))`) and compare it yourself before deciding
  whether a re-crawled job actually changed and needs re-improving.
- Batches are capped at `ingest.rawJobsBatchMax` (200) per request — page your crawler's output.
- Response: `{ "upserted": <count>, "ids": ["<RawJob.id>", ...] }`.

A newly-inserted `RawJob` has no linked `Job` yet — it's automatically visible to the queue below.

## Step 2 — Improving: claim work, then post improved `Job`s

Claim a batch of raw jobs that need rewriting:

```
GET /api/ingest/queue?stage=improving&limit=50
Authorization: Bearer <token>
```

Returns `RawJob`s where `fetchStatus = "FETCHED"` and no `Job` has been linked to them yet, oldest
`discoveredAt` first, capped by `ingest.queueClaimMax` (50). This is a **read**, not a claim/lock —
if you run multiple rewriter workers concurrently, either shard by `sourceId` or accept some
duplicate work (a second worker's upsert on the same `RawJob.id` in step 2 below is harmless, just
wasted LLM cost). A real locking mechanism (e.g. a `claimedAt`/`claimedBy` column) is a good
phase-2/3 addition once concurrency is actually a problem.

For each raw job you've rewritten, upsert the resulting `Job`:

```
POST /api/ingest/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobs": [
    {
      "slug": "forklift-operator-northwind-logistics",   // you own slug generation; must be unique
      "rawJobId": "<RawJob.id>",                          // links back to the raw record
      "title": "Forklift Operator",
      "companyName": "Northwind Logistics",               // Company is upserted by name → slug
      "companyDomain": "northwindlogistics.example",
      "location": "Austin, TX",
      "remoteType": "ONSITE",                              // ONSITE | HYBRID | REMOTE
      "employmentType": "FULL_TIME",                       // FULL_TIME | PART_TIME | CONTRACT | INTERNSHIP | TEMPORARY
      "salaryMin": 19, "salaryMax": 23,
      "salaryCurrency": "USD", "salaryPeriod": "HOURLY",   // HOURLY | DAILY | WEEKLY | MONTHLY | YEARLY
      "description": "Rewritten, brand-voice description...",
      "highlights": ["Weekly pay", "Health benefits day one"],
      "tags": ["entry-level", "benefits"],                 // Tag rows are upserted by name → slug
      "applyUrl": "https://northwindlogistics.example/careers/forklift-operator",
      "isNative": false,
      "status": "READY",                                   // → set to "PUBLISHED" when it should go live
      "postedAt": "2026-08-01T00:00:00.000Z",
      "closesAt": null
    }
  ]
}
```

- **Idempotency**: upserted on `slug`. Re-posting the same slug (e.g. re-running the rewriter on an
  edited `RawJob`) updates the existing `Job` in place — tags are replaced (delete + recreate the
  join rows), everything else is a straight overwrite.
- `Company` and `Tag` rows are upserted automatically from `companyName`/`companyDomain` and `tags`
  — you never need to look up or create their IDs yourself.
- Batches capped at `ingest.jobsBatchMax` (100) per request.
- Set `status` directly to `"PUBLISHED"` if your pipeline has no separate review step, or to
  `"READY"` first and flip it to `"PUBLISHED"` in a second call once a human/automated check
  approves it — both are valid; the UI only cares that it eventually reaches `"PUBLISHED"`.
- `"REJECTED"` and `"ARCHIVED"` are also valid values for `status` if a raw job turns out to be spam/
  a duplicate/expired — set it and the UI will simply never show it.

## `ImprovementRun` — optional but recommended audit trail

Not written by any Phase 1 endpoint (there's no `POST /api/ingest/improvement-runs` — add one if you
want it enforced through the API, or just `prisma.improvementRun.create()` directly from your
worker, same DB). Fields: `rawJobId`, `jobId` (nullable — set once the `Job` exists), `model`,
`promptVersion`, `inputTokens`/`outputTokens`, `diff` (Json, your shape), `status`
(`PENDING`/`RUNNING`/`SUCCEEDED`/`FAILED`), `startedAt`/`finishedAt`. Exists so you can answer "which
model/prompt version produced this listing" and "what did the raw→improved diff look like" months
later — worth writing even though nothing reads it yet.

## What phase 2 should NOT need to touch
- No Prisma schema changes — every field a crawler/rewriter needs already exists.
- No changes to `src/app/jobs/**`, `src/components/**`, or the public `GET` endpoints.
- No new Clerk configuration.

## Known gaps to pick up in phase 2/3
- No `POST` endpoint for creating `Source` rows — added directly to the DB in Phase 1.
- No claim-locking on the improving queue (see above) — fine for one worker, needed for several.
- No webhook/notification when a `Job` flips to `PUBLISHED` — `JobAlert` delivery (emailing users
  matching their `SavedSearch`) is unbuilt; the schema/CRUD API for alerts exists, sending them
  doesn't.
