# 02 — API

Serverless route handlers (`app/api/**/route.ts`). All payloads validated with Zod schemas shared
between route handlers and client code (`src/lib/validation/`).

## Public (no auth, cacheable)
- [x] `GET /api/jobs` — cursor pagination; filters: `q`, `location`, `remote`, `employmentType`,
      `salaryMin`, `tags`, `company`, `postedWithin`. Returns only the fields `JobCard` needs.
- [x] `GET /api/jobs/[slug]` — full job detail for `PUBLISHED` jobs only (404 otherwise).
- [x] `GET /api/companies/[slug]` — company profile + its published jobs.
- [x] `GET /api/filters` — facet counts (locations, remote types, employment types, tags) over
      `PUBLISHED` jobs.
- [x] Rate-limit public search (`GET /api/jobs`). In-memory fixed-window limiter
      (`src/lib/rate-limit.ts`) — good enough for one instance; a multi-instance deploy needs a
      shared store (Redis/Upstash), which is a new dependency not added here. Not applied to
      `/api/filters` (cheap aggregate query, low abuse value).

## Authenticated (Clerk session)
- [x] `POST /api/saved-jobs` / `DELETE /api/saved-jobs/[jobId]`, `GET /api/saved-jobs`.
- [x] CRUD (Create/Read/Delete) for `/api/saved-searches` (+ `[id]`).
- [x] CRUD (Create/Read/Update/Delete) for `/api/alerts` (+ `[id]`), gated by `featureFlags.alerts`.

## Ingestion (bearer service token from env, not Clerk)
- [x] `POST /api/ingest/raw-jobs` — upsert `RawJob` batches, idempotent on `sourceId + externalId`.
- [x] `POST /api/ingest/jobs` — upsert improved `Job`s and transition `status`.
- [x] `GET /api/ingest/queue?stage=improving` — claim work (returns jobs in `IMPROVING`/`DISCOVERED`
      as applicable, capped by `ingest.queueClaimMax`).

## Checklist
- [x] Zod schemas for every request/response shape, colocated under `src/lib/validation/` and imported
      by both route handlers and any client fetch helpers.
- [x] Typed error responses (`{ error: { code, message } }`) with correct HTTP status codes.
- [x] List query filter tests (`src/lib/__tests__/job-query.test.ts`, run via `pnpm test` —
      Node's built-in `node:test` runner, no new dependency). Covers `q`, `location`, `remote`,
      `employmentType`, `salaryMin`, `tags`, `company`, `postedWithin`. Cursor paging is exercised
      by the smoke test in this doc's history, not a unit test (needs a DB).
- [x] Public GET routes set `Cache-Control`/revalidate per `config/cache.ts`, not ad hoc numbers.

## Note: Clerk `auth.protect()` removed from the proxy
`src/proxy.ts` runs `clerkMiddleware()` with no `.protect()` calls. Every one of the routes above
already checks `auth()` itself and returns a proper `401` JSON body. Calling `auth.protect()` in
the proxy on top of that made Clerk redirect plain API requests (no `Accept: text/html`) to its
hosted sign-in page instead of returning JSON — see `docs/todo/04-auth.md`.
