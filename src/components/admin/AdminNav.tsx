"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const DESTINATIONS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/runs", label: "Runs" },
  { href: "/admin/failures", label: "Failures" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="border-b border-line-strong bg-ink">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4 md:px-6">
        <span className="mr-4 text-label uppercase tracking-[0.08em] text-surface/60">Ingestion Admin</span>
        <ul className="flex items-center gap-1">
          {DESTINATIONS.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "focus-ring flex min-h-10 items-center rounded-pill px-3 text-meta font-medium transition-colors",
                    isActive ? "bg-surface text-ink" : "text-surface/80 hover:bg-surface/10 hover:text-surface",
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
          className="focus-ring ml-auto rounded-pill px-3 py-2 text-meta font-medium text-surface/70 hover:bg-surface/10 hover:text-surface"
        >
          Back to site
        </Link>
      </div>
    </nav>
  );
}
