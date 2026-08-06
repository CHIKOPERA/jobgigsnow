"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { navItems } from "@/config/categories";

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
    <nav aria-label="Browse by category" className="bg-ink" ref={containerRef}>
      <ul className="mx-auto flex max-w-6xl flex-wrap px-2 md:px-4">
        {navItems.map((item, index) => {
          const subcategories = item.kind === "opportunity" ? item.category.subcategories : undefined;
          const isOpen = openIndex === index;

          if (!subcategories || subcategories.length === 0) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="focus-ring flex min-h-(--hit-min) items-center px-3 text-meta text-[#DCDED2] hover:text-[#F6F7F0]"
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="relative">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="focus-ring flex min-h-(--hit-min) items-center gap-1.5 px-3 text-meta text-[#DCDED2] hover:text-[#F6F7F0]"
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className="text-[10px] transition-transform"
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
                  className="absolute left-0 top-full z-30 min-w-56 border border-white/10 bg-ink py-1.5 shadow-lg"
                >
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpenIndex(null)}
                    className="focus-ring block min-h-(--hit-min) px-4 py-2.5 text-meta text-[#F6F7F0] hover:bg-white/10"
                  >
                    All {item.label}
                  </Link>
                  <div className="mx-3 my-1 border-t border-white/10" aria-hidden="true" />
                  {subcategories.map((sub) => (
                    <Link
                      key={sub.tagSlug}
                      href={`${item.href}&tags=${sub.tagSlug}`}
                      role="menuitem"
                      onClick={() => setOpenIndex(null)}
                      className="focus-ring block min-h-(--hit-min) px-4 py-2.5 text-meta text-[#DCDED2] hover:bg-white/10 hover:text-[#F6F7F0]"
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
    </nav>
  );
}
