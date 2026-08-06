"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DESTINATIONS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/saved", label: "Saved" },
];

export function TabBar() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const traveled = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.sign(delta) !== Math.sign(traveled.current)) {
        traveled.current = 0;
      }
      traveled.current += delta;
      if (traveled.current > 200) setHidden(true);
      if (traveled.current < 0) setHidden(false);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] transition-transform md:hidden"
      style={{
        transform: hidden ? "translateY(100%)" : "translateY(0)",
        transitionDuration: "var(--dur-state)",
        transitionTimingFunction: "var(--ease-standard)",
      }}
    >
      <ul className="flex">
        {DESTINATIONS.map((dest) => {
          const isActive = pathname.startsWith(dest.href);
          return (
            <li key={dest.href} className="flex-1">
              <Link
                href={dest.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "focus-ring flex min-h-(--hit-min) flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
                  isActive ? "text-ink" : "text-ink-muted",
                ].join(" ")}
              >
                {dest.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
