# JobGigsNow — Phase 1

A job board web app. This is **Phase 1 — Posting**: the public-facing job board (browse, search,
filter, job detail, saved jobs), reading from a schema shaped so phase-2 crawler/rewriter workers
can plug in later with no UI changes. See `jobgigsnow/prompt.md` for the original brief and
`docs/todo/` for what's done and what's deliberately deferred.

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
