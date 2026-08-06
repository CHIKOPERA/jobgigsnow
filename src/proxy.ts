import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Populates the Clerk auth context for every request so `auth()` works in server components
 * and route handlers. Deliberately does NOT call `auth.protect()` on any route: every
 * saved-jobs/searches/alerts route handler already checks `auth()` itself and returns a proper
 * 401 — enforcing it again here via `.protect()` made Clerk redirect plain API requests (e.g.
 * `fetch()` calls with a wildcard `Accept` header) to its hosted sign-in page instead of
 * returning JSON. Page-level gating (`/saved`) is likewise handled by the page itself so it can
 * show an inline sign-in prompt rather than a hard redirect.
 */
export const proxy = clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
