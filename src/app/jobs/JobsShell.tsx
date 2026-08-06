import type { ReactNode } from "react";
import { opportunityCategories } from "@/config/categories";
import { SearchBar } from "@/components/filters/SearchBar";
import { FilterChips } from "@/components/filters/FilterChips";
import { JobList } from "@/components/job/JobList";
import { LoadMoreJobs } from "@/components/job/LoadMoreJobs";
import { fetchJobPage, getFilterFacets } from "@/lib/job-query";
import { getSavedJobIds } from "@/lib/saved";
import { jobListQuerySchema } from "@/lib/validation/job";

interface JobsShellProps {
  searchParams: Record<string, string | string[] | undefined>;
  activeSlug?: string;
  detail?: ReactNode;
}

function toSingleValues(searchParams: JobsShellProps["searchParams"]) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function JobsShell({ searchParams, activeSlug, detail }: JobsShellProps) {
  const flat = toSingleValues(searchParams);
  const query = jobListQuerySchema.parse(flat);

  const [{ jobs, nextCursor }, facets] = await Promise.all([fetchJobPage(query), getFilterFacets()]);
  const savedJobIds = await getSavedJobIds(jobs.map((j) => j.id));

  const queryString = new URLSearchParams(flat).toString();
  const hasDetail = Boolean(detail);
  const categoryLabel = query.category ? opportunityCategories[query.category].label : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
      {categoryLabel && (
        <h1 className="mb-3 text-title font-semibold" style={{ fontSize: "22px" }}>
          {categoryLabel}
        </h1>
      )}
      <div className="flex flex-col gap-3">
        <SearchBar defaultValue={query.q} hiddenParams={flat} />
        <FilterChips facets={facets} />
      </div>

      <p aria-live="polite" className="mt-4 text-meta text-ink-muted">
        {categoryLabel
          ? jobs.length === 0
            ? `No matching ${categoryLabel.toLowerCase()} found`
            : `${jobs.length}${nextCursor ? "+" : ""} matching ${categoryLabel.toLowerCase()} found`
          : jobs.length === 0
            ? "No jobs found"
            : `${jobs.length}${nextCursor ? "+" : ""} job${jobs.length === 1 ? "" : "s"} found`}
      </p>

      <div className="mt-3 flex gap-6">
        <div className={["flex-1 min-w-0", hasDetail ? "hidden lg:block lg:max-w-md" : ""].join(" ")}>
          <JobList
            jobs={jobs}
            savedJobIds={savedJobIds}
            activeSlug={activeSlug}
            detailHref={(slug) => `/jobs/${slug}${queryString ? `?${queryString}` : ""}`}
          />
          <LoadMoreJobs initialCursor={nextCursor} queryString={queryString} detailBasePath="/jobs" />
        </div>

        {hasDetail && <div className="min-w-0 flex-1">{detail}</div>}
      </div>
    </div>
  );
}
