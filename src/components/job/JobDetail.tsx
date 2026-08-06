import type { JobDetailDto } from "@/lib/validation/job";
import {
  accentTileClass,
  daysLeftLabel,
  employmentLabel,
  formatRelativeTime,
  formatSalary,
  initials,
  remoteLabel,
} from "@/lib/format";
import { Button, LinkButton } from "@/components/ui/Button";
import { SaveButton } from "./SaveButton";
import { descriptionContainsHtml, sanitizeJobDescription } from "@/lib/job-rich-text";

interface JobDetailProps {
  job: JobDetailDto;
  saved: boolean;
}

export function JobDetail({ job, saved }: JobDetailProps) {
  const isClosed = job.status !== "PUBLISHED";
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod);
  const richDescription = descriptionContainsHtml(job.description) ? sanitizeJobDescription(job.description) : null;

  return (
    <article className="rounded-md border border-line bg-surface p-6">
      <div className="relative flex items-start gap-4 pr-14">
        <div
          className={[
            "flex h-10 w-10 flex-none items-center justify-center rounded-(--radius-tile) text-label font-semibold",
            accentTileClass(job.companyName),
          ].join(" ")}
          aria-hidden="true"
        >
          {initials(job.companyName)}
        </div>
        <div className="min-w-0">
          <h1 className="text-title font-semibold tracking-[-0.015em]" style={{ fontSize: "22px" }}>
            {job.title}
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            {job.companyName} · {job.location}
          </p>
        </div>
        {!isClosed && <SaveButton jobId={job.id} jobTitle={job.title} initialSaved={saved} />}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {salary && (
          <span className="rounded-pill bg-bg px-2.5 py-[5px] text-[12px] text-[#2b2d24]">{salary}</span>
        )}
        <span className="rounded-pill bg-bg px-2.5 py-[5px] text-[12px] text-[#2b2d24]">
          {remoteLabel(job.remoteType)}
        </span>
        <span className="rounded-pill bg-bg px-2.5 py-[5px] text-[12px] text-[#2b2d24]">
          {employmentLabel(job.employmentType)}
        </span>
        {!isClosed && daysLeftLabel(job.closesAt) && (
          <span className="rounded-pill bg-bg px-2.5 py-[5px] text-[12px] text-[#2b2d24]">
            {daysLeftLabel(job.closesAt)}
          </span>
        )}
        {job.isNew && !isClosed && (
          <span className="rounded-pill bg-accent-orchid px-2.5 py-[5px] text-[12px] text-[#2b2d24]">
            New
          </span>
        )}
      </div>

      <p className="mt-3 text-meta text-ink-muted">
        {isClosed ? "This posting is no longer accepting applications." : formatRelativeTime(job.postedAt)}
      </p>

      {job.highlights.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2">
          {job.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2 text-body">
              <span aria-hidden="true" className="text-accent-mint">
                ✓
              </span>
              {highlight}
            </li>
          ))}
        </ul>
      )}

      {richDescription ? (
        <div className="job-rich-text mt-6 text-body leading-relaxed" dangerouslySetInnerHTML={{ __html: richDescription }} />
      ) : (
        <div className="mt-6 whitespace-pre-line text-body leading-relaxed">{job.description}</div>
      )}

      {job.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {job.tags.map((tag) => (
            <span key={tag} className="rounded-pill border border-line-strong px-2.5 py-[5px] text-[12px]">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8">
        {isClosed ? (
          <Button variant="disabled" disabled>
            Applications closed
          </Button>
        ) : job.applyUrl ? (
          <LinkButton href={job.applyUrl} target="_blank" rel="noopener noreferrer">
            Apply now
          </LinkButton>
        ) : null}
      </div>
    </article>
  );
}
