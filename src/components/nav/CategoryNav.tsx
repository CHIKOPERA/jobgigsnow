"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { navItems, type NavItem } from "@/config/categories";

const opportunityNavItems = navItems.filter(
  (item): item is Extract<NavItem, { kind: "opportunity" }> =>
    item.kind === "opportunity" && item.category.value !== "JOB",
);

export function CategoryNav() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenIndex(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenIndex(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <nav aria-label="Browse opportunities" className="border-t border-line/70 bg-bg/70" ref={containerRef}>
      <div className="mx-auto flex max-w-6xl items-center px-4 md:px-6">
        <span className="mr-3 hidden shrink-0 items-center gap-3 text-label uppercase text-ink-muted lg:flex">
          Opportunities
          <span aria-hidden="true" className="h-4 w-px bg-line-strong" />
        </span>
        <ul className="flex min-w-0 flex-1 flex-nowrap gap-0.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible">
          {opportunityNavItems.map((item, index) => {
            const subcategories = item.category.subcategories;
            const isOpen = openIndex === index;

            if (!subcategories || subcategories.length === 0) {
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className="focus-ring flex min-h-10 items-center rounded-pill px-3 text-meta font-medium text-ink-muted transition-colors hover:bg-accent-mint hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.href} className="relative shrink-0">
                <Link
                  href={item.href}
                  className="focus-ring flex min-h-10 items-center rounded-pill px-3 text-meta font-medium text-ink-muted hover:bg-accent-mint hover:text-ink md:hidden"
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="focus-ring hidden min-h-10 items-center gap-1.5 rounded-pill px-3 text-meta font-medium text-ink-muted hover:bg-accent-mint hover:text-ink md:flex"
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className="text-[9px] transition-transform"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transitionDuration: "var(--dur-state)",
                    }}
                  >
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-[calc(100%+4px)] z-30 hidden min-w-56 rounded-md border border-line bg-surface p-1.5 shadow-[0_16px_40px_rgb(20_21_15/0.14)] md:block"
                  >
                    <Link
                      href={item.href}
                      role="menuitem"
                      onClick={() => setOpenIndex(null)}
                      className="focus-ring block min-h-10 rounded-sm px-3 py-2.5 text-meta font-medium text-ink hover:bg-accent-mint"
                    >
                      All {item.label}
                    </Link>
                    <div className="mx-2 my-1 border-t border-line" aria-hidden="true" />
                    {subcategories.map((sub) => (
                      <Link
                        key={sub.tagSlug}
                        href={`${item.href}&tags=${sub.tagSlug}`}
                        role="menuitem"
                        onClick={() => setOpenIndex(null)}
                        className="focus-ring block min-h-10 rounded-sm px-3 py-2.5 text-meta text-ink-muted hover:bg-accent-mint hover:text-ink"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
