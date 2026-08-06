"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DESTINATIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/crawl", label: "Quick crawl" },
  { href: "/admin/review", label: "Review" },
  { href: "/admin/runs", label: "Runs" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/failures", label: "Failures" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="sticky top-0 z-30 border-b border-white/10 bg-ink text-surface">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link href="/admin" className="focus-ring flex shrink-0 items-center gap-2 rounded-md">
          <span className="grid size-8 place-items-center rounded-[10px] bg-accent-mint text-[13px] font-semibold text-ink">
            J
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-meta font-semibold">JobGigsNow</span>
            <span className="block text-[10px] uppercase tracking-[0.14em] text-surface/50">Admin studio</span>
          </span>
        </Link>
        <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DESTINATIONS.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "focus-ring flex min-h-10 items-center rounded-pill px-3 text-meta font-medium transition-colors",
                    isActive
                      ? "bg-accent-mint text-ink"
                      : "text-surface/70 hover:bg-accent-mint/15 hover:text-surface",
                  ].join(" ")}
                  style={{ transitionDuration: "var(--dur-state)" }}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/jobs"
          className="focus-ring hidden shrink-0 rounded-pill px-3 py-2 text-meta font-medium text-surface/65 hover:bg-surface/10 hover:text-surface md:block"
        >
          View site ↗
        </Link>
      </div>
    </nav>
  );
}
