export interface SyntheticJobPosting {
  title: string;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  datePosted?: string | null;
  validThrough?: string | null;
  employmentType?: string | null;
  applyUrl: string;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

/** Turns an ATS JSON response into the same HTML/JSON-LD shape used by the normal extractors. */
export function jobPostingHtml(job: SyntheticJobPosting): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description ?? undefined,
    datePosted: job.datePosted ?? undefined,
    validThrough: job.validThrough ?? undefined,
    employmentType: job.employmentType ?? undefined,
    url: job.applyUrl,
    hiringOrganization: job.company ? { "@type": "Organization", name: job.company } : undefined,
    jobLocation: job.location
      ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } }
      : undefined,
  };
  const safeJson = JSON.stringify(jsonLd).replaceAll("</script", "<\\/script");
  return `<!doctype html><html><head><link rel="canonical" href="${escapeHtml(job.applyUrl)}"><script type="application/ld+json">${safeJson}</script></head><body><main><h1>${escapeHtml(job.title)}</h1>${job.location ? `<p class="job-location">${escapeHtml(job.location)}</p>` : ""}<article class="job-description">${job.description ?? ""}</article><a class="apply-url" href="${escapeHtml(job.applyUrl)}">Apply</a></main></body></html>`;
}
