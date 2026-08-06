import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { site } from "@/config";
import { CategoryNav } from "./CategoryNav";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
        <Link
          href="/jobs"
          aria-label={`${site.name} home`}
          className="focus-ring group flex items-center gap-2.5 rounded-md"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-[10px] bg-ink text-[13px] font-semibold text-surface transition-transform group-hover:-rotate-3"
            style={{ transitionDuration: "var(--dur-state)" }}
          >
            J
          </span>
          <span className="text-[20px] font-semibold tracking-[-0.025em]">{site.name}</span>
        </Link>

        <nav aria-label="Primary" className="ml-10 hidden items-center gap-1 md:flex">
          <Link
            href="/jobs"
            className="focus-ring rounded-pill px-3 py-2 text-meta font-medium text-ink hover:bg-accent-mint"
          >
            Jobs
          </Link>
          <Link
            href="/articles"
            className="focus-ring rounded-pill px-3 py-2 text-meta font-medium text-ink-muted hover:bg-accent-mint hover:text-ink"
          >
            Career guides
          </Link>
          <Link
            href="/courses"
            className="focus-ring rounded-pill px-3 py-2 text-meta font-medium text-ink-muted hover:bg-accent-mint hover:text-ink"
          >
            Courses
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/saved"
            className="focus-ring hidden rounded-pill px-3 py-2 text-meta font-medium text-ink-muted hover:bg-accent-mint hover:text-ink sm:block"
          >
            Saved jobs
          </Link>
          <Show
            when="signed-in"
            fallback={
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="focus-ring flex h-10 items-center rounded-pill bg-ink px-4 text-meta font-medium text-surface transition-transform hover:-translate-y-0.5"
                  style={{ transitionDuration: "var(--dur-state)" }}
                >
                  Sign in
                </button>
              </SignInButton>
            }
          >
            <UserButton />
          </Show>
        </div>
      </div>
      <CategoryNav />
    </header>
  );
}
