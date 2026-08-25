import type { CrawlConfig } from "@/lib/validation/source";
import { jobPostingHtml } from "./job-html";

type OracleConfig = Extract<CrawlConfig, { provider: "oracle" }>;

interface OracleRequisition {
  Id?: string;
  Title?: string;
  PrimaryLocation?: string;
  ShortDescriptionStr?: string;
  ExternalDescriptionStr?: string;
  ExternalResponsibilitiesStr?: string;
  ExternalQualificationsStr?: string;
  ExternalPostedStartDate?: string;
  ExternalPostedEndDate?: string;
  PostedDate?: string;
  PostingEndDate?: string;
  JobType?: string;
  RequisitionType?: string;
}

interface OracleSearchResponse {
  items?: Array<{ TotalJobsCount?: number; requisitionList?: OracleRequisition[] }>;
}

function origin(host: string) {
  return host.startsWith("http") ? new URL(host).origin : `https://${host}`;
}

export async function discoverOracle(config: OracleConfig, fetcher: typeof fetch = fetch): Promise<string[]> {
  const links = new Set<string>();
  let knownTotal: number | null = null;
  for (let page = 0; page < config.maxPages; page++) {
    const offset = page * config.pageSize;
    const endpoint = new URL("/hcmRestApi/resources/latest/recruitingCEJobRequisitions", origin(config.host));
    endpoint.searchParams.set("onlyData", "true");
    endpoint.searchParams.set("expand", "requisitionList.workLocation,requisitionList.otherWorkLocations,requisitionList.secondaryLocations");
    endpoint.searchParams.set(
      "finder",
      `findReqs;siteNumber=${config.siteNumber},limit=${config.pageSize},offset=${offset},sortBy=POSTING_DATES_DESC`,
    );
    const res = await fetcher(endpoint, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`Oracle Recruiting returned HTTP ${res.status}`);
    const data = (await res.json()) as OracleSearchResponse;
    const search = data.items?.[0];
    if (typeof search?.TotalJobsCount === "number" && search.TotalJobsCount > 0) {
      knownTotal = search.TotalJobsCount;
    }
    const postings = search?.requisitionList ?? [];
    for (const posting of postings) {
      if (posting.Id) {
        links.add(`${origin(config.host)}/hcmUI/CandidateExperience/${config.language}/sites/${config.siteNumber}/job/${posting.Id}`);
      }
    }
    if (postings.length < config.pageSize || (knownTotal !== null && offset + postings.length >= knownTotal)) break;
  }
  return [...links];
}

export function isOracleJobUrl(url: URL): boolean {
  return url.hostname.endsWith(".oraclecloud.com") && /\/CandidateExperience\/[^/]+\/sites\/[^/]+\/job\/[^/]+/.test(url.pathname);
}

export async function acquireOracle(url: URL, companyName: string, fetcher: typeof fetch = fetch): Promise<string> {
  const match = url.pathname.match(/\/sites\/[^/]+\/job\/([^/]+)/);
  if (!match) throw new Error("Unrecognized Oracle Recruiting job URL.");
  const endpoint = new URL(`/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails/${encodeURIComponent(match[1])}`, url.origin);
  endpoint.searchParams.set("onlyData", "true");
  endpoint.searchParams.set("expand", "workLocation,otherWorkLocations,secondaryLocations");
  const res = await fetcher(endpoint, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Oracle Recruiting detail returned HTTP ${res.status}`);
  const job = (await res.json()) as OracleRequisition;
  if (!job.Title) throw new Error("Oracle Recruiting detail did not include a job title.");
  const description = [job.ExternalDescriptionStr, job.ExternalResponsibilitiesStr, job.ExternalQualificationsStr, job.ShortDescriptionStr]
    .filter(Boolean)
    .join("\n");
  return jobPostingHtml({
    title: job.Title,
    company: companyName,
    location: job.PrimaryLocation,
    description,
    datePosted: job.ExternalPostedStartDate ?? job.PostedDate,
    validThrough: job.ExternalPostedEndDate ?? job.PostingEndDate,
    employmentType: job.JobType ?? job.RequisitionType,
    applyUrl: url.toString(),
  });
}
