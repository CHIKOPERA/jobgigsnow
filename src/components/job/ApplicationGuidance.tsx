import type { ApplicationGuidance as ApplicationGuidanceData } from "@/lib/application-guidance";

interface ApplicationGuidanceProps {
  guidance: ApplicationGuidanceData | null;
  closesAt: string | null;
  applyUrl: string | null;
}

function formatDeadline(value: string | null): string {
  if (!value) return "Not specified by the employer";
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function GuidanceValue({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="mt-1 text-meta text-ink-muted">Not specified in the advert</p>;
  }
  if (items.length === 1) return <p className="mt-1 text-meta text-ink">{items[0]}</p>;
  return (
    <ul className="mt-1 space-y-1 text-meta text-ink">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span aria-hidden="true" className="mt-[0.55em] h-1 w-1 flex-none rounded-full bg-ink-muted" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ApplicationGuidance({ guidance, closesAt, applyUrl }: ApplicationGuidanceProps) {
  const method = guidance?.applicationMethod || (applyUrl ? "Apply on the official application page." : "Not specified in the advert");
  const estimate = guidance?.estimatedApplicationMinutes
    ? `About ${guidance.estimatedApplicationMinutes} minutes`
    : "Not enough information to estimate";
  const guidanceRows: Array<{ label: string; items: string[] }> = [
    { label: "Essential requirements", items: guidance?.essentialRequirements ?? [] },
    { label: "Preferred requirements", items: guidance?.preferredRequirements ?? [] },
    { label: "Required qualifications", items: guidance?.qualifications ?? [] },
    { label: "Required experience", items: guidance?.experience ?? [] },
    { label: "Documents to prepare", items: guidance?.documents ?? [] },
    { label: "Licence, registration or certification", items: guidance?.licences ?? [] },
  ];

  return (
    <div className="mt-6 space-y-4">
      {guidance?.summary && (
        <section aria-labelledby="application-summary-heading" className="rounded-lg bg-accent-mint/55 p-5 md:p-6">
          <p className="text-label font-semibold uppercase tracking-[0.08em] text-ink-muted">JobGigsNow guidance</p>
          <h2 id="application-summary-heading" className="mt-1 text-title font-semibold">Application summary</h2>
          <p className="mt-3 text-body leading-relaxed">{guidance.summary}</p>
        </section>
      )}

      <section aria-labelledby="before-you-apply-heading" className="rounded-lg border border-line bg-surface-sunk p-5 md:p-6">
        <div className="border-b border-line pb-4">
          <h2 id="before-you-apply-heading" className="text-title font-semibold">Before you apply</h2>
          <p className="mt-1 text-meta text-ink-muted">A quick check based on the official advert.</p>
        </div>

        <dl className="mt-1 grid gap-x-6 sm:grid-cols-2">
          {guidanceRows.map(({ label, items }) => (
            <div key={label} className="border-b border-line py-4">
              <dt className="text-label font-semibold uppercase tracking-[0.06em] text-ink-muted">{label}</dt>
              <dd><GuidanceValue items={items} /></dd>
            </div>
          ))}

          <div className="border-b border-line py-4">
            <dt className="text-label font-semibold uppercase tracking-[0.06em] text-ink-muted">Application deadline</dt>
            <dd className="mt-1 text-meta text-ink">{formatDeadline(closesAt)}</dd>
          </div>
          <div className="border-b border-line py-4">
            <dt className="text-label font-semibold uppercase tracking-[0.06em] text-ink-muted">Reference number</dt>
            <dd className="mt-1 text-meta text-ink">{guidance?.referenceNumber || "Not specified in the advert"}</dd>
          </div>
          <div className="border-b border-line py-4 sm:col-span-2">
            <dt className="text-label font-semibold uppercase tracking-[0.06em] text-ink-muted">How to apply</dt>
            <dd className="mt-1 text-meta text-ink">{method}</dd>
          </div>
          <div className="py-4 sm:col-span-2">
            <dt className="text-label font-semibold uppercase tracking-[0.06em] text-ink-muted">Estimated application time</dt>
            <dd className="mt-1 text-meta text-ink">
              {estimate}
              {guidance?.estimatedApplicationMinutes ? <span className="text-ink-muted"> · JobGigsNow estimate</span> : null}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
