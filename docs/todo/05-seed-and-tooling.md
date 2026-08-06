# 05 — Seed & tooling

## Checklist
- [x] `prisma/seed.ts` — 40 realistic jobs across 8 companies, mixed statuses (mostly `PUBLISHED`,
      a few `CLOSED`/`ARCHIVED`/`DISCOVERED`/`IMPROVING` so the pipeline states are visible in the DB
      even though the UI only reads `PUBLISHED`). Idempotent (safe to re-run) via upserts.
- [x] `"postinstall": "prisma generate"` in `package.json`.
- [x] Scripts: `db:migrate`, `db:push`, `db:seed`, `db:studio`, `typecheck`, `lint`, `format`.
- [x] `.env.example` documents every variable in `src/config/env.ts`'s schema.
- [x] `pnpm typecheck && pnpm lint && pnpm build` all pass clean. Also added `pnpm test`
      (`node --import tsx --test`, Node's built-in runner — no new dependency) covering the job-list
      filter logic per `docs/todo/02-api.md`.
