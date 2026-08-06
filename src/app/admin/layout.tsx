import type { ReactNode } from "react";
import { SignInButton } from "@clerk/nextjs";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Guards every /admin/** page. This does NOT protect /api/admin/** route handlers — Next layouts
 * don't wrap route handlers — each of those independently calls requireAdmin() as its first line.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-title font-semibold">
          {admin.reason === "unauthenticated" ? "Sign in required" : "Forbidden"}
        </h1>
        <p className="text-body text-ink-muted">
          {admin.reason === "unauthenticated"
            ? "Sign in with an admin account to view the ingestion admin area."
            : "Your account doesn't have admin access. Ask an existing admin to grant it via the Clerk dashboard."}
        </p>
        {admin.reason === "unauthenticated" && (
          <SignInButton mode="modal">
            <button
              type="button"
              className="focus-ring flex h-11 items-center rounded-pill bg-ink px-5 text-meta font-medium text-surface"
            >
              Sign in
            </button>
          </SignInButton>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-bg">
      <AdminNav />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">{children}</main>
    </div>
  );
}
