# Prompt for Claude Code — jobgigsnow job board (Phase 1)

Copy everything below the line into Claude Code, with the `design_handoff_job_board_ui/` folder present in the repo.

---

Build **Phase 1** of jobgigsnow, a job board web app. Work from the design references in
`design_handoff_job_board_ui/` — `README.md` (component specs, states, breakpoints, a11y and perf
budget), `tokens.json` / `tokens.css` (the style layer), and `Job Board UI Guide.dc.html` (open it in a
browser to see the intended result). The HTML is a **design reference**, not code to copy: recreate it
as React components. It is high-fidelity — match colours, type, spacing and states exactly.

## Stack
- Next.js (App Router, TypeScript, React Server Components by default)
- Prisma 7 ORM (PostgreSQL; use the new `prisma.config.ts` / generated client location conventions of v7, not v5/v6 patterns — check the installed version's docs before writing schema tooling)
- Clerk for auth — **only** for saved jobs, saved searches and alerts. Browsing, search, filtering and
  job detail are fully public and must render for signed-out users with no auth round-trip.
- Serverless route handlers (`app/api/**/route.ts`), no long-running processes.
- Styling: Tailwind v4 with the tokens loaded via `@theme` in `app/globals.css` (fall back to CSS
  Modules + `tokens.css` if you prefer — either way, no hard-coded hex values in components).
- Fonts via `next/font` (`next/font/local` for Saans if the files exist in the repo, otherwise
  `next/font/google` → Schibsted Grotesk).

## Product model — three stages
The product is a pipeline. **Only stage 3 is in scope now**, but the schema and API must be shaped so
stages 1 and 2 can plug in later by writing rows into the same database with no UI changes.

1. **Sourcing** (phase 2) — crawlers visit a configured list of source sites, discover job postings,
   and write raw records.
2. **Improving** (phase 2) — a rewrite step turns a raw record into brand-voice, post-ready content.
3. **Posting** (phase 1, this build) — the public UI reads only published, improved records.

Most jobs link out to an external apply URL; a minority may be native. Design for external-first.

## Phase 1 deliverables
1. **Data model** (Prisma schema) that covers all three stages.
2. **Serverless API** — public read endpoints for the UI, plus authenticated write endpoints for
   ingestion so phase-2 workers can populate the DB without touching app code.
3. **UI** — the screens specified in the handoff README, reading from the DB.
4. **Seed data** so the UI is usable before any crawler exists.

### Data model requirements
Model these entities (names are a starting point — justify any changes):
- `Source` — a site to crawl: name, base URL, crawl strategy/selector config, cadence, enabled flag, last run.
- `RawJob` — the sourcing output: sourceId, external ID/URL, raw title/company/location/description
  payload (JSON), content hash for dedupe, discovery timestamp, fetch status.
- `Job` — the improved, postable record the UI reads: slug, title, company, location, remote type,
  employment type, salary min/max/currency/period, description (rewritten), highlights/tags,
  `applyUrl` (external) or native flag, `postedAt`, `closesAt`, `status`.
- `JobStatus` enum covering the full pipeline: `DISCOVERED → IMPROVING → READY → PUBLISHED → CLOSED → ARCHIVED`
  (plus `REJECTED`). The public UI queries `PUBLISHED` only.
- `Company` — name, slug, domain, optional logo URL (the UI uses initials until the detail route).
- `Tag` / `JobTag` — skills and facets used by filters.
- `SavedJob`, `SavedSearch`, `JobAlert` — keyed by Clerk `userId` (string), no local user table
  unless you need profile data; if you do add `User`, keep `clerkId` unique and sync via webhook.
- `ImprovementRun` — audit trail linking a RawJob to a Job: model used, prompt version, input/output
  diff or token counts, status, timestamps. Phase 2 writes it; phase 1 just defines it.

Add the indexes the list query actually needs (status + postedAt, company, location, tag join,
full-text or trigram on title/description) and a unique constraint that makes ingestion idempotent
(`sourceId + externalId`, plus the content hash). Every table gets `createdAt`/`updatedAt`.

### API requirements
Public (no auth, cacheable):
- `GET /api/jobs` — cursor pagination, filters: q, location, remote, employmentType, salaryMin, tags,
  company, postedWithin. Returns the exact fields the card needs and nothing more.
- `GET /api/jobs/[slug]`, `GET /api/companies/[slug]`, `GET /api/filters` (facet counts).

Authenticated (Clerk session):
- `POST/DELETE /api/saved-jobs/[jobId]`, `GET /api/saved-jobs`, CRUD for saved searches/alerts.

Ingestion (machine auth — a bearer service token from env, not Clerk; phase-2 workers call these):
- `POST /api/ingest/raw-jobs` — upsert RawJob batches, idempotent on `sourceId + externalId`.
- `POST /api/ingest/jobs` — upsert improved Jobs and transition status.
- `GET /api/ingest/queue?stage=improving` — claim work.

Validate every payload with Zod, share the schemas between route handlers and client code, and return
typed errors. Rate-limit public search.

### UI requirements
Follow the handoff README precisely. Build: job list (mobile single column → filter rail at 768 →
list + detail split at 1200), job detail, saved jobs (auth-gated), and the empty/loading/error states.
Non-negotiables from the design: 48px minimum hit areas, visible focus rings on every surface, the
card as one link with the save button as a sibling, live-region result counts, no colour-only status,
`prefers-reduced-motion` respected, and the perf budget (≤60 KB first-load JS, server components for
the list, client components only for the save button and filter chips).

## Working conventions — follow these throughout
1. **Todo documents with checklists.** Before writing code, create `docs/todo/` with one markdown file
   per workstream (`01-data-model.md`, `02-api.md`, `03-ui.md`, `04-auth.md`, `05-seed-and-tooling.md`,
   `06-phase-2-handoff.md`), each a `- [ ]` checklist with acceptance criteria. Tick items off as you
   complete them and keep them current — they are the source of truth for progress.
2. **Centralized config.** No scattered magic values. One `src/config/` module exporting typed,
   env-validated settings: `site`, `pagination`, `filters`, `cache` (revalidate times), `ingest`
   (token, batch sizes), `sources` (crawl defaults), `auth` (Clerk public routes), `featureFlags`
   (e.g. `nativeApply`, `alerts`). Parse `process.env` once through a Zod schema in `src/config/env.ts`
   and fail fast at boot. Nothing reads `process.env` directly outside that file.
3. **postinstall script.** Add `"postinstall": "prisma generate"` to `package.json` (extend it if the
   build needs more — keep it idempotent and CI-safe).
4. Also add scripts: `db:migrate`, `db:push`, `db:seed`, `db:studio`, `typecheck`, `lint`, `format`.
5. Commit `.env.example` documenting every variable the config schema requires.

## Order of work
1. Scaffold + tokens + fonts + config module + postinstall, then the todo docs.
2. Prisma schema + migration + seed (≈40 realistic jobs across 8 companies, mixed statuses).
3. API route handlers with Zod schemas and tests for the list query filters.
4. UI, mobile first: job card → list → filters → detail → saved.
5. Write `docs/todo/06-phase-2-handoff.md` explaining exactly how a crawler and a rewriter plug in
   (endpoints, auth, status transitions, idempotency rules).

Ask me before adding any dependency beyond Next.js, Prisma, Clerk, Zod and Tailwind.
