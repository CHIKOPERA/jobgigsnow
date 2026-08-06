# 04 — Auth

Clerk, scoped to saved jobs / saved searches / alerts only. Browsing, search, filtering and job detail
must render for signed-out users with no auth round-trip.

## Checklist
- [x] `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) runs `clerkMiddleware()` with
      **no** `.protect()` calls. See "Why no route protection in the proxy" below — every route that
      needs auth checks it explicitly and returns its own response, which is stricter than it sounds.
- [x] `<ClerkProvider>` wraps the root layout; publishable key auto-read by Clerk from
      `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (validated present/well-formed by `config/env.ts` at boot,
      but Clerk's own SDK reads the env var itself — we never pass the secret value through app code).
- [x] Sign-in entry point is a Clerk `<SignInButton mode="modal">`, triggered from the save button
      (`JobCard`/`JobDetail`), the header, and the `/saved` page's own inline prompt — never a global
      gate or a hard redirect.
- [x] `SavedJob`, `SavedSearch`, `JobAlert` queries always scope by Clerk `userId` from `auth()`.
- [x] No local `User` table — if profile data becomes necessary later, add one keyed by unique
      `clerkId`, synced via Clerk webhook (not needed for Phase 1).
- [x] Ingestion routes are verified to bypass Clerk entirely and rely solely on the bearer token check
      (`src/lib/ingest-auth.ts`).

## Why no route protection in the proxy
The first pass matched `/saved(.*)`, `/api/saved-jobs(.*)`, `/api/saved-searches(.*)` and
`/api/alerts(.*)` in the proxy and called `auth.protect()` on them. Two real problems showed up in
smoke testing:

1. **`/saved` (the page)** — `auth.protect()` redirects unauthenticated *page* requests to Clerk's
   hosted sign-in page. That's a jarring full-page navigation away from the app, inconsistent with
   the modal-based "sign in to save this job" pattern used everywhere else. Fix: don't protect the
   page in the proxy at all — `src/app/saved/page.tsx` calls `auth()` itself and renders an inline
   "Sign in to see your saved jobs" prompt with a modal trigger when signed out.
2. **The `/api/saved-jobs` etc. routes** — every one of these route handlers already calls `auth()`
   and returns a proper `401 { error: {...} }` JSON body when signed out (see `docs/todo/02-api.md`).
   Layering `auth.protect()` in the proxy on top of that is redundant, and it actively broke the
   contract: Clerk's redirect-vs-401 heuristic isn't reliable for plain `fetch()` calls (no
   `Accept: text/html`), so exercising these routes without a full browser session sometimes still
   redirected instead of returning JSON.

Net effect: `clerkMiddleware()` still runs on every request (required for `auth()` to work anywhere
in a server component or route handler), but authorization decisions are made explicitly in
application code, not implicitly by the proxy. This is easier to test and matches the explicit
`401`/inline-prompt behavior the UI actually wants.

## Known testing caveat
Clerk *development* instances (`pk_test_...`/`sk_test_...`) require a client-side "dev browser"
handshake to resolve auth state reliably — real browsers complete it transparently via
`<ClerkProvider>`'s client JS on first load. Tools without that JS runtime (`curl`, Postman without
following redirects) will see `auth()` behave conservatively (a redirect with
`x-clerk-auth-reason: dev-browser-missing`) even after removing `.protect()`. This is expected Clerk
dev-instance behavior, not an app bug — verified by testing with `.protect()` removed entirely and
seeing the same header. Verify auth flows in a real browser, not curl.
