"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { filters } from "@/config/filters";
import { salaryFilter } from "@/config/job-taxonomy";

interface FilterSheetProps {
  facets: {
    industries: { value: string; label: string; count: number }[];
    provinces: { value: string; label: string; count: number }[];
    tags: { value: string; label: string; count: number }[];
  };
  onClose: () => void;
}

export function FilterSheet({ facets, onClose }: FilterSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const titleId = useId();

  const [industry, setIndustry] = useState(searchParams.get("industry") ?? "");
  const [province, setProvince] = useState(searchParams.get("province") ?? "");
  const [salaryMin, setSalaryMin] = useState(Number(searchParams.get("salaryMin") ?? 0));
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) ?? [],
  );

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function apply() {
    const next = new URLSearchParams(searchParams.toString());
    if (industry) next.set("industry", industry);
    else next.delete("industry");
    if (province) next.set("province", province);
    else next.delete("province");
    if (salaryMin > 0) next.set("salaryMin", String(salaryMin));
    else next.delete("salaryMin");
    if (postedWithin) next.set("postedWithin", postedWithin);
    else next.delete("postedWithin");
    if (selectedTags.length > 0) next.set("tags", selectedTags.join(","));
    else next.delete("tags");
    next.delete("cursor");
    router.push(`/jobs?${next.toString()}`);
    onClose();
  }

  function clear() {
    setIndustry("");
    setProvince("");
    setSalaryMin(0);
    setPostedWithin("");
    setSelectedTags([]);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-line bg-surface p-6"
        style={{ transitionDuration: "var(--dur-sheet)" }}
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-title font-semibold">
            All filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-pill text-body"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-label font-medium">
              Industry
              <select value={industry} onChange={(event) => setIndustry(event.target.value)} className="focus-ring mt-1.5 h-12 w-full rounded-md border border-line-strong bg-surface px-3.5 text-body">
                <option value="">All industries</option>
                {facets.industries.map((item) => <option key={item.value} value={item.value}>{item.label} ({item.count})</option>)}
              </select>
            </label>
            <label className="text-label font-medium">
              Province
              <select value={province} onChange={(event) => setProvince(event.target.value)} className="focus-ring mt-1.5 h-12 w-full rounded-md border border-line-strong bg-surface px-3.5 text-body">
                <option value="">All provinces</option>
                {facets.provinces.map((item) => <option key={item.value} value={item.value}>{item.label} ({item.count})</option>)}
              </select>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="salary-range" className="text-label font-medium">Minimum monthly salary</label>
              <output htmlFor="salary-range" className="text-meta font-semibold">
                {salaryMin === 0 ? "Any salary" : `R${salaryMin.toLocaleString("en-ZA")}+`}
              </output>
            </div>
            <input
              id="salary-range"
              type="range"
              min={salaryFilter.minMonthly}
              max={salaryFilter.maxMonthly}
              step={salaryFilter.step}
              value={salaryMin}
              onChange={(event) => setSalaryMin(Number(event.target.value))}
              className="mt-3 w-full accent-[#25271f]"
            />
            <div className="mt-1 flex justify-between text-[11px] text-ink-muted"><span>Any</span><span>R150,000+ monthly equivalent</span></div>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-label font-medium">Posted within</legend>
            <div className="flex flex-wrap gap-2">
              {filters.postedWithinOptions.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  aria-pressed={postedWithin === String(opt.days)}
                  onClick={() =>
                    setPostedWithin((prev) => (prev === String(opt.days) ? "" : String(opt.days)))
                  }
                  className={[
                    "focus-ring h-10 rounded-pill px-4 text-meta",
                    postedWithin === String(opt.days)
                      ? "bg-ink text-[#F6F7F0]"
                      : "border border-line-strong text-ink",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          {facets.tags.length > 0 && (
            <fieldset>
              <legend className="mb-1.5 block text-label font-medium">Tags</legend>
              <div className="flex flex-wrap gap-2">
                {facets.tags.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    aria-pressed={selectedTags.includes(tag.value)}
                    onClick={() => toggleTag(tag.value)}
                    className={[
                      "focus-ring h-10 rounded-pill px-4 text-meta",
                      selectedTags.includes(tag.value)
                        ? "bg-ink text-[#F6F7F0]"
                        : "border border-line-strong text-ink",
                    ].join(" ")}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <Button variant="secondary" onClick={clear} fullWidthBelowMd={false} className="flex-1">
            Clear
          </Button>
          <Button onClick={apply} fullWidthBelowMd={false} className="flex-1">
            Show results
          </Button>
        </div>
      </div>
    </div>
  );
}
