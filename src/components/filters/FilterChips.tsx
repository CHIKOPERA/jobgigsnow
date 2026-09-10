"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FilterSheet } from "./FilterSheet";

interface QuickFilter {
  label: string;
  param: string;
  value: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  { label: "Remote", param: "remote", value: "REMOTE" },
  { label: "Full-time", param: "employmentType", value: "FULL_TIME" },
  { label: "R30k+/month", param: "salaryMin", value: "30000" },
];

interface FilterChipsProps {
  facets: {
    industries: { value: string; label: string; count: number }[];
    provinces: { value: string; label: string; count: number }[];
    employmentTypes: { value: string; label: string; count: number }[];
    remoteTypes: { value: string; label: string; count: number }[];
    tags: { value: string; label: string; count: number }[];
  };
}

export function FilterChips({ facets }: FilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  function toggle(param: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (next.get(param) === value) {
      next.delete(param);
    } else {
      next.set(param, value);
    }
    next.delete("cursor");
    router.push(`/jobs?${next.toString()}`);
  }

  function choose(param: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    next.delete("cursor");
    router.push(`/jobs?${next.toString()}`);
  }

  const activeExtraCount = ["industry", "province", "salaryMin", "tags", "postedWithin"].filter((p) =>
    searchParams.has(p),
  ).length;

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Quick filters"
      >
        <select
          aria-label="Filter by industry"
          value={searchParams.get("industry") ?? ""}
          onChange={(event) => choose("industry", event.target.value)}
          className="focus-ring h-10 flex-none rounded-pill border border-line-strong bg-surface px-3 text-meta text-ink"
        >
          <option value="">All industries</option>
          {facets.industries.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select
          aria-label="Filter by province"
          value={searchParams.get("province") ?? ""}
          onChange={(event) => choose("province", event.target.value)}
          className="focus-ring h-10 flex-none rounded-pill border border-line-strong bg-surface px-3 text-meta text-ink"
        >
          <option value="">All provinces</option>
          {facets.provinces.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        {QUICK_FILTERS.map((filter) => {
          const isActive = searchParams.get(filter.param) === filter.value;
          return (
            <button
              key={filter.param}
              type="button"
              aria-pressed={isActive}
              onClick={() => toggle(filter.param, filter.value)}
              className={[
                "focus-ring flex h-10 flex-none items-center gap-1.5 rounded-pill px-4 text-meta transition-colors",
                isActive
                  ? "bg-ink text-[#F6F7F0]"
                  : "border border-line-strong bg-transparent text-ink hover:bg-surface",
              ].join(" ")}
            >
              {filter.label}
              {isActive && <span aria-hidden="true">✕</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="focus-ring flex h-10 flex-none items-center gap-1.5 rounded-pill border border-line-strong bg-transparent px-4 text-meta text-ink hover:bg-surface"
        >
          All filters
          {activeExtraCount > 0 && (
            <span className="rounded-pill bg-accent-orchid px-1.5 text-[11px]">{activeExtraCount}</span>
          )}
        </button>
      </div>

      {sheetOpen && <FilterSheet facets={facets} onClose={() => setSheetOpen(false)} />}
    </>
  );
}
