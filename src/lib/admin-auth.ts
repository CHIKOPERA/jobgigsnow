import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { errorResponse } from "@/lib/validation/common";

export type AdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "unauthenticated" | "forbidden" };

/**
 * There's no role/organization concept in Clerk for this app otherwise — admin access is granted
 * by setting `{ role: "admin" }` on a user's publicMetadata via the Clerk Dashboard or Backend API
 * (no in-app UI does this; the first admin must always be granted from outside the app).
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, reason: "unauthenticated" };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata?.role !== "admin") return { ok: false, reason: "forbidden" };

  return { ok: true, userId };
}

export function adminAuthErrorResponse(reason: "unauthenticated" | "forbidden") {
  return reason === "unauthenticated"
    ? errorResponse("UNAUTHORIZED", "Sign in to access the admin area.", 401)
    : errorResponse("FORBIDDEN", "This account does not have admin access.", 403);
}
