import sanitizeHtml from "sanitize-html";
import { employmentLabel, formatSalary, remoteLabel } from "./format";

export interface JobSeoInput {
  id: string;
  slug: string;
  title: string;
  category: "JOB" | "INTERNSHIP" | "LEARNERSHIP" | "APPRENTICESHIP" | "GRADUATE_PROGRAMME" | "CALL_FOR_APPLICATIONS" | "FUNDING";
  companyName: string;
  companyDomain: string | null;
  location: string;
  remoteType: "ONSITE" | "HYBRID" | "REMOTE";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "TEMPORARY";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null;
  description: string;
  postedAt: string | null;
  closesAt: string | null;
  applyUrl: string | null;
  isNative: boolean;
  socialImageUrl: string | null;
}

const EMPLOYMENT_TYPES: Record<JobSeoInput["employmentType"], string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
  TEMPORARY: "TEMPORARY",
};

const SALARY_UNITS: Record<NonNullable<JobSeoInput["salaryPeriod"]>, string> = {
  HOURLY: "HOUR",
  DAILY: "DAY",
  WEEKLY: "WEEK",
  MONTHLY: "MONTH",
  YEARLY: "YEAR",
};

function trimUrl(value: string) {
  return value.replace(/\/$/, "");
}

function companyUrl(domain: string | null): string | undefined {
  if (!domain) return undefined;
  try {
    return new URL(/^https?:\/\//i.test(domain) ? domain : `https://${domain}`).toString();
  } catch {
    return undefined;
  }
}

export function plainTextDescription(description: string): string {
  return sanitizeHtml(description, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > maxLength * 0.7 ? lastSpace : undefined).trim()}…`;
}

export function buildJobMetaDescription(job: JobSeoInput): string {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod);
  const details = [remoteLabel(job.remoteType), employmentLabel(job.employmentType), salary]
    .filter(Boolean)
    .join(" · ");
  const summary = `${job.title} at ${job.companyName} in ${job.location}. ${details}. View the role, requirements and how to apply.`;
  return truncateAtWord(summary, 160);
}

function salarySchema(job: JobSeoInput) {
  if (job.salaryMin === null && job.salaryMax === null) return undefined;
  if (!job.salaryCurrency || !job.salaryPeriod) return undefined;

  return {
    "@type": "MonetaryAmount",
    currency: job.salaryCurrency,
    value: {
      "@type": "QuantitativeValue",
      ...(job.salaryMin !== null ? { minValue: job.salaryMin } : {}),
      ...(job.salaryMax !== null ? { maxValue: job.salaryMax } : {}),
      unitText: SALARY_UNITS[job.salaryPeriod],
    },
  };
}

function remoteLocationRequirement(location: string) {
  const normalized = location.trim();
  if (!normalized || /^(remote|anywhere|worldwide|global)$/i.test(normalized)) return undefined;
  if (/^(south africa|za)$/i.test(normalized)) {
    return { "@type": "Country", name: "South Africa" };
  }
  return { "@type": "AdministrativeArea", name: normalized };
}

export function buildJobPostingSchema(job: JobSeoInput, siteUrl: string) {
  if (!job.postedAt || job.category === "CALL_FOR_APPLICATIONS" || job.category === "FUNDING") {
    return null;
  }

  const baseUrl = trimUrl(siteUrl);
  const url = `${baseUrl}/jobs/${job.slug}`;
  const sameAs = companyUrl(job.companyDomain);
  const applicantLocationRequirements = job.remoteType === "REMOTE"
    ? remoteLocationRequirement(job.location)
    : undefined;
  const baseSalary = salarySchema(job);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${url}#job-posting`,
    url,
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: job.companyName,
      value: job.id,
    },
    datePosted: job.postedAt,
    ...(job.closesAt ? { validThrough: job.closesAt } : {}),
    employmentType: EMPLOYMENT_TYPES[job.employmentType],
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyName,
      ...(sameAs ? { sameAs } : {}),
    },
    ...(job.remoteType !== "REMOTE" ? {
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.location,
        },
      },
    } : {}),
    ...(job.remoteType === "REMOTE" ? { jobLocationType: "TELECOMMUTE" } : {}),
    ...(applicantLocationRequirements ? { applicantLocationRequirements } : {}),
    ...(baseSalary ? { baseSalary } : {}),
    ...(job.socialImageUrl ? { image: job.socialImageUrl } : {}),
    directApply: job.isNative,
  };
}

export function buildSiteSchemas(name: string, description: string, siteUrl: string) {
  const url = trimUrl(siteUrl);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${url}/#organization`,
      name,
      url,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${url}/#website`,
      name,
      url,
      description,
      publisher: { "@id": `${url}/#organization` },
      inLanguage: "en-ZA",
    },
  ];
}

export function buildJobBreadcrumbSchema(job: Pick<JobSeoInput, "slug" | "title">, siteUrl: string) {
  const baseUrl = trimUrl(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Jobs", item: `${baseUrl}/jobs` },
      { "@type": "ListItem", position: 2, name: job.title, item: `${baseUrl}/jobs/${job.slug}` },
    ],
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
