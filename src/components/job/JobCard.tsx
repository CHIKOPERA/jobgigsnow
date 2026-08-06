import Link from "next/link";
import { opportunityCategories } from "@/config/categories";
import type { JobCardDto } from "@/lib/validation/job";
import {
  accentTileClass,
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
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod);

  const chips = isClosed
    ? []
    : [salary, remoteLabel(job.remoteType), employmentLabel(job.employmentType)].filter(
        (c): c is string => Boolean(c),
      );

  return (
    <div className="relative">
      <Link
        href={href}
        className={[
          "focus-ring block rounded-md border p-4 transition-colors",
          isClosed
            ? "border-line bg-surface-sunk opacity-72"
            : active
              ? "border-ink bg-surface"
              : "border-line bg-surface hover:border-line-strong",
        ].join(" ")}
        style={active ? { boxShadow: "var(--ring)" } : undefined}
      >
        <div className="flex items-start gap-3 pr-11">
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
            <div
              className={[
                "text-title font-semibold tracking-[-0.01em]",
                isClosed ? "line-through" : "",
              ].join(" ")}
              style={{ fontSize: "17px" }}
            >
              {job.title}
            </div>
            <div className="mt-0.5 text-meta text-ink-muted">
              {job.companyName} · {isClosed ? formatClosedTime(job.closesAt) : job.location}
            </div>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.category !== "JOB" && !isClosed && (
              <span className="rounded-pill border border-line-strong px-2.5 py-[5px] text-[12px] text-ink-muted">
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
            {job.isNew && (
              <span className="rounded-pill bg-accent-orchid px-2.5 py-[5px] text-[12px] text-[#2b2d24]">
                New
              </span>
            )}
          </div>
        )}
      </Link>
      {!isClosed && <SaveButton jobId={job.id} jobTitle={job.title} initialSaved={saved} />}
    </div>
  );
}
