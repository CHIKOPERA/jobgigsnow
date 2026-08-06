import type { CrawlConfig } from "@/lib/validation/source";
import { jobPostingHtml } from "./job-html";

type WorkdayConfig = Extract<CrawlConfig, { provider: "workday" }>;

interface WorkdaySearchResponse {
  total?: number;
  jobPostings?: Array<{ externalPath?: string }>;
}

interface WorkdayDetailResponse {
  jobPostingInfo?: {
    title?: string;
    jobDescription?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    timeType?: string;
    externalUrl?: string;
  };
  hiringOrganization?: { name?: string };
}

function origin(host: string) {
  return host.startsWith("http") ? new URL(host).origin : `https://${host}`;
}

export async function discoverWorkday(config: WorkdayConfig, fetcher: typeof fetch = fetch): Promise<string[]> {
  const links = new Set<string>();
  const endpoint = `${origin(config.host)}/wday/cxs/${config.tenant}/${config.site}/jobs`;
  for (let page = 0; page < config.maxPages; page++) {
    const offset = page * config.pageSize;
    const res = await fetcher(endpoint, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit: config.pageSize, offset, searchText: "" }),
    });
    if (!res.ok) throw new Error(`Workday returned HTTP ${res.status}`);
    const data = (await res.json()) as WorkdaySearchResponse;
    const postings = data.jobPostings ?? [];
    for (const posting of postings) {
      if (posting.externalPath) links.add(`${origin(config.host)}/${config.site}${posting.externalPath}`);
    }
    if (postings.length < config.pageSize || offset + postings.length >= (data.total ?? 0)) break;
  }
  return [...links];
}

export function isWorkdayJobUrl(url: URL): boolean {
  return url.hostname.endsWith(".myworkdayjobs.com") && /\/job\//.test(url.pathname);
}

export async function acquireWorkday(url: URL, fetcher: typeof fetch = fetch): Promise<string> {
  const [site, marker, ...rest] = url.pathname.split("/").filter(Boolean);
  if (!site || marker !== "job" || rest.length === 0) throw new Error("Unrecognized Workday job URL.");
  const tenant = url.hostname.split(".")[0];
  const endpoint = `${url.origin}/wday/cxs/${tenant}/${site}/job/${rest.join("/")}`;
  const res = await fetcher(endpoint, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Workday detail returned HTTP ${res.status}`);
  const data = (await res.json()) as WorkdayDetailResponse;
  const job = data.jobPostingInfo;
  if (!job?.title) throw new Error("Workday detail did not include a job title.");
  return jobPostingHtml({
    title: job.title,
    company: data.hiringOrganization?.name,
    location: job.location,
    description: job.jobDescription,
    datePosted: job.startDate,
    validThrough: job.endDate,
    employmentType: job.timeType,
    applyUrl: job.externalUrl ?? url.toString(),
  });
}
