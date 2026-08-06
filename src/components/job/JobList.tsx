import type { JobCardDto } from "@/lib/validation/job";
import { JobCard } from "./JobCard";

interface JobListProps {
  jobs: JobCardDto[];
  savedJobIds: Set<string>;
  activeSlug?: string;
  detailHref: (slug: string) => string;
}

export function JobList({ jobs, savedJobIds, activeSlug, detailHref }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div
        role="status"
        className="rounded-md border border-line bg-surface p-6 text-center text-body text-ink-muted"
      >
        No jobs match your filters yet. Try widening your search or clearing a filter.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {jobs.map((job) => (
        <li key={job.id}>
          <JobCard
            job={job}
            href={detailHref(job.slug)}
            saved={savedJobIds.has(job.id)}
            active={job.slug === activeSlug}
          />
        </li>
      ))}
    </ul>
  );
}
