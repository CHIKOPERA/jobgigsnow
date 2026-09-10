"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FilterSheet } from "./FilterSheet";
import { opportunityCategories } from "@/config/categories";

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
  const activeCount = ["category", "industry", "province", "remote", "employmentType", "salaryMin", "tags", "postedWithin"]
    .filter((param) => searchParams.has(param)).length;

  function clearAll() {
    const q = searchParams.get("q");
    router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
  }

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-4 lg:block lg:overflow-visible lg:rounded-md lg:border lg:border-line lg:bg-surface lg:p-4"
        role="group"
        aria-label="Quick filters"
      >
        <div className="mb-4 hidden items-center justify-between border-b border-line pb-4 lg:flex">
          <span className="font-semibold">Filters {activeCount > 0 && <span className="ml-1 rounded-pill bg-[#17633a] px-2 py-0.5 text-[11px] text-white">{activeCount}</span>}</span>
          {activeCount > 0 && <button type="button" onClick={clearAll} className="text-[12px] text-danger hover:underline">Clear all</button>}
        </div>

        <div className="hidden lg:block">
          <p className="mb-2 text-label uppercase text-ink-muted">Opportunity type</p>
          <div className="mb-5 flex flex-wrap gap-2">
            {Object.values(opportunityCategories).map((category) => {
              const active = searchParams.get("category") === category.value;
              return <button key={category.value} type="button" onClick={() => toggle("category", category.value)} className={["rounded-pill border px-3 py-1.5 text-[12px]", active ? "border-[#17633a] bg-[#17633a] text-white" : "border-line bg-surface text-ink-muted"].join(" ")}>{category.label}</button>;
            })}
          </div>
        </div>

        <select
          aria-label="Filter by industry"
          value={searchParams.get("industry") ?? ""}
          onChange={(event) => choose("industry", event.target.value)}
          className="focus-ring h-10 flex-none rounded-pill border border-line-strong bg-surface px-3 text-meta text-ink lg:mb-3 lg:w-full lg:rounded-sm"
        >
          <option value="">All industries</option>
          {facets.industries.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select
          aria-label="Filter by province"
          value={searchParams.get("province") ?? ""}
          onChange={(event) => choose("province", event.target.value)}
          className="focus-ring h-10 flex-none rounded-pill border border-line-strong bg-surface px-3 text-meta text-ink lg:mb-3 lg:w-full lg:rounded-sm"
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
                "focus-ring flex h-10 flex-none items-center gap-1.5 rounded-pill px-4 text-meta transition-colors lg:mb-2 lg:w-full lg:justify-center",
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
          className="focus-ring flex h-10 flex-none items-center gap-1.5 rounded-pill border border-line-strong bg-transparent px-4 text-meta text-ink hover:bg-surface lg:mt-1 lg:w-full lg:justify-center lg:rounded-sm"
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
