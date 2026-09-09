# JobGigsNow

A job board with a simple publishing flow: **sources → fetch → rewrite → first Pexels image → publish**.

Add sources in the admin and use **Fetch jobs** to import that source immediately. The daily
manager checks enabled sources in learned priority order. Each job URL is captured, rewritten,
paired with the first Pexels image when one can be saved, and published. Image search/storage
failures do not block publication.

The normal importer is one path used by the admin button, single-job import, and cron. One failed
job is recorded and skipped while the rest of the source continues. Manual editing remains
available for published jobs and unfinished drafts.

The admin focuses on Sources, Drafts, and Content. HTML sources have a simple careers URL and
job-link selector form; provider-specific settings remain available in advanced setup.

## Daily learning manager

One durable Vercel Workflow runs each morning to measure traffic/search performance, maintain
category coverage, learn which sources produce reliable results, publish within the configured
daily range, and report every decision in **Admin → Daily manager**. It uses the same ingestion
pipeline rather than adding a second worker system. See [`docs/daily-manager.md`](docs/daily-manager.md)
for migration, Google API and environment-variable setup.

## Page capture with Jina

Jina Reader is enabled by default for ordinary job details, including single-URL imports.
No API key or extra service is required for basic access. It returns text that goes directly
into the existing rewrite pipeline. Workday, Oracle, Cornerstone, and SmartRecruiters keep
their direct API integrations. Listing-page discovery keeps its existing selectors and fetcher.

Optional server environment variables:
- `JINA_API_KEY`: authenticated access; Jina token billing applies.
- `JINA_ENABLED=false`: use the legacy direct HTML detail fetcher.

Requests are paced at one every 3.1 seconds per server process, including requests for different
source domains. Multiple server instances share Jina's external quota but not this local gate.
Robots rules still apply; empty responses, source HTTP failures, and recognized challenge pages
are rejected instead of sent to the rewriter. Authentication errors and rate limits are reported
without immediate repeated requests.

## Stack
Next.js 16 (App Router, TypeScript) · Prisma 7 (PostgreSQL) · Clerk (saved jobs/searches/alerts
only) · Zod · Tailwind v4.

## Getting started
```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL, Clerk keys, INGEST_SERVICE_TOKEN
pnpm db:migrate         # or: npx prisma dev   (spins up a local Postgres for you)
pnpm db:seed            # ~40 jobs across 8 companies, mixed pipeline statuses
pnpm dev
```

Other scripts: `db:push`, `db:studio`, `typecheck`, `lint`, `format`, `test`, `build`.

## Where things live
- `prisma/schema.prisma` — data model for all three pipeline stages (sourcing/improving/posting).
- `src/config/` — centralized, env-validated config; nothing reads `process.env` outside
  `src/config/env.ts`.
- `src/lib/validation/` — Zod schemas shared between API route handlers and (eventually) client code.
- `src/app/api/` — public read endpoints, Clerk-authenticated saved-jobs/searches/alerts endpoints,
  and bearer-token-authenticated ingestion endpoints for phase-2 workers.
- `src/app/jobs/`, `src/app/saved/` — the actual UI.
- `docs/todo/` — per-workstream checklists, kept current as the source of truth for what's actually
  done vs. deferred (including a few honest gaps — see `03-ui.md`'s perf-budget note and
  `04-auth.md`'s auth-flow notes).
- `docs/todo/06-phase-2-handoff.md` — exactly how a crawler/rewriter plugs into this schema and API.

## Design source
`design_handoff_job_board_ui/` — the design handoff (component specs, tokens, and an HTML reference
you can open directly in a browser). Recreated as React components in `src/components/`, not copied.
