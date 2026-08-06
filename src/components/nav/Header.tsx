import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { site } from "@/config";
import { CategoryNav } from "./CategoryNav";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/jobs" className="focus-ring rounded-sm text-title font-semibold">
          {site.name}
        </Link>
        <Link
          href="/saved"
          className="focus-ring ml-auto rounded-sm text-body text-ink-muted hover:text-ink md:ml-0"
        >
          Saved
        </Link>
        <div>
          <Show
            when="signed-in"
            fallback={
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="focus-ring flex h-11 items-center rounded-pill bg-ink px-5 text-meta font-medium text-[#F6F7F0]"
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
