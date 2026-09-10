import Link from "next/link";
import { opportunityCategories } from "@/config/categories";
import { provinces } from "@/config/job-taxonomy";
import type { JobCardDto } from "@/lib/validation/job";
import {
  accentTileClass,
  daysLeftLabel,
  employmentLabel,
  formatClosedTime,
  formatSalary,
  initials,
  remoteLabel,
} from "@/lib/format";
import { SaveButton } from "./SaveButton";

interface JobCardProps {
  job: JobCardDto;
  href: string;
  saved: boolean;
  active?: boolean;
}

export function JobCard({ job, href, saved, active = false }: JobCardProps) {
  const isClosed = job.status !== "PUBLISHED";
  const showEmploymentFacets = job.category !== "FUNDING" && job.category !== "CALL_FOR_APPLICATIONS";
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod);

  const chips = isClosed
    ? []
    : [
        showEmploymentFacets ? salary : null,
        showEmploymentFacets ? remoteLabel(job.remoteType) : null,
        showEmploymentFacets ? employmentLabel(job.employmentType) : null,
      ].filter((c): c is string => Boolean(c));

  return (
    <div className="relative">
      <Link
        href={href}
        className={[
          "focus-ring flex min-h-[240px] flex-col rounded-md border p-5 transition-all",
          isClosed
            ? "border-line bg-surface-sunk opacity-72"
            : active
              ? "border-ink bg-surface"
              : "border-line bg-surface shadow-[0_1px_2px_rgb(20_21_15/0.06)] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_8px_24px_rgb(20_21_15/0.08)]",
        ].join(" ")}
        style={active ? { boxShadow: "var(--ring)" } : undefined}
      >
        <div className="flex items-start gap-3.5 pr-10">
          {job.imageUrl ? (
            <div
              role="img"
              aria-label={job.imageAlt ?? `${job.title} at ${job.companyName}`}
              className="h-14 w-14 flex-none rounded-(--radius-tile) bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(job.imageUrl)})` }}
            />
          ) : (
            <div
              className={[
                "flex h-14 w-14 flex-none items-center justify-center rounded-(--radius-tile) text-label font-semibold",
                accentTileClass(job.companyName),
              ].join(" ")}
              aria-hidden="true"
            >
              {initials(job.companyName)}
            </div>
          )}
          <div className="min-w-0">
            <div
              className={[
                "text-title font-semibold tracking-[-0.01em]",
                isClosed ? "line-through" : "",
              ].join(" ")}
              style={{ fontSize: "17px", lineHeight: 1.35 }}
            >
              {job.title}
            </div>
            <div className="mt-1 text-meta text-ink-muted">
              {job.companyName}
            </div>
          </div>
        </div>

        {job.summary && (
          <p className="mt-4 line-clamp-2 min-h-[2.9em] text-meta leading-[1.55] text-ink-muted">
            {job.summary}
          </p>
        )}

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.category !== "JOB" && !isClosed && (
              <span className="rounded-pill border border-[#b8dccb] bg-[#e3f5ea] px-2.5 py-[5px] text-[12px] text-[#17633a]">
                {opportunityCategories[job.category].label}
              </span>
            )}
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-pill bg-bg px-2.5 py-[5px] text-[12px] text-[#2b2d24]"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3 text-[12px] text-ink-muted">
          <span className="line-clamp-1">{isClosed ? formatClosedTime(job.closesAt) : `${provinces[job.province]} · ${job.location}`}</span>
          <span className="flex-none font-medium text-danger">
            {daysLeftLabel(job.closesAt) ?? (job.isNew ? "New" : "")}
          </span>
        </div>
      </Link>
      {!isClosed && <SaveButton jobId={job.id} jobTitle={job.title} initialSaved={saved} />}
    </div>
  );
}
