"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { filters } from "@/config/filters";

interface FilterSheetProps {
  facets: {
    locations: { value: string; label: string; count: number }[];
    tags: { value: string; label: string; count: number }[];
  };
  onClose: () => void;
}

export function FilterSheet({ facets, onClose }: FilterSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const titleId = useId();

  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) ?? [],
  );

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function apply() {
    const next = new URLSearchParams(searchParams.toString());
    if (location) next.set("location", location);
    else next.delete("location");
    if (postedWithin) next.set("postedWithin", postedWithin);
    else next.delete("postedWithin");
    if (selectedTags.length > 0) next.set("tags", selectedTags.join(","));
    else next.delete("tags");
    next.delete("cursor");
    router.push(`/jobs?${next.toString()}`);
    onClose();
  }

  function clear() {
    setLocation("");
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
          <div>
            <label htmlFor="location-input" className="mb-1.5 block text-label font-medium">
              Location
            </label>
            <input
              id="location-input"
              type="text"
              list="location-options"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, state or Remote"
              className="focus-ring h-12 w-full rounded-sm border border-line-strong bg-surface px-3.5 text-body"
              style={{ borderRadius: "8px" }}
            />
            <datalist id="location-options">
              {facets.locations.map((loc) => (
                <option key={loc.value} value={loc.value} />
              ))}
            </datalist>
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
