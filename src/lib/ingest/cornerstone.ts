import type { CrawlConfig } from "@/lib/validation/source";
import { jobPostingHtml } from "./job-html";

type CornerstoneConfig = Extract<CrawlConfig, { provider: "cornerstone" }>;

interface CornerstoneContext {
  cultureID: number;
  cultureName: string;
  token: string;
  endpoints: { cloud: string };
}

interface CornerstoneRequisition {
  requisitionId?: string | number;
  displayJobTitle?: string;
  postingEffectiveDate?: string;
  postingExpirationDate?: string;
  locations?: Array<{ localizedName?: string; name?: string; city?: string; state?: string; country?: string }>;
}

interface CornerstoneSearchResponse {
  data?: { requisitions?: CornerstoneRequisition[]; totalCount?: number };
}

interface CornerstoneDetail {
  displayTitle?: string;
  externalDescription?: string;
  jobAd?: string;
  primaryLocation?: { locationDisplayTitle?: string; title?: string; city?: string; state?: string; country?: string };
}

function origin(host: string) {
  return host.startsWith("http") ? new URL(host).origin : `https://${host}`;
}

function homeUrl(config: CornerstoneConfig): string {
  return `${origin(config.host)}/ux/ats/careersite/${config.siteId}/home?c=${encodeURIComponent(config.corp)}`;
}

export function parseCornerstoneContext(html: string): CornerstoneContext {
  const marker = "csod.context=";
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) throw new Error("Cornerstone page did not expose its public career-site context.");
  const start = html.indexOf("{", markerIdx);
  if (start === -1) throw new Error("Cornerstone context JSON not found.");

  // Walk forward with balanced-brace counting to find the end of the JSON object.
  // A non-greedy regex like /\{[\s\S]*?\}/ would stop at the first closing brace and truncate
  // nested objects (e.g. endpoints.cloud), so we count braces explicitly instead.
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(html.slice(start, i + 1)) as CornerstoneContext;
    }
  }
  throw new Error("Cornerstone context JSON was not properly terminated.");
}

async function getContext(config: CornerstoneConfig, fetcher: typeof fetch): Promise<CornerstoneContext> {
  const res = await fetcher(homeUrl(config));
  if (!res.ok) throw new Error(`Cornerstone career site returned HTTP ${res.status}`);
  return parseCornerstoneContext(await res.text());
}

function authHeaders(context: CornerstoneContext) {
  return {
    accept: "application/json",
    authorization: `Bearer ${context.token}`,
    "content-type": "application/json",
    "CSOD-Accept-Language": context.cultureName,
  };
}

function displayLocation(locations: CornerstoneRequisition["locations"]): string | null {
  const first = locations?.[0];
  if (!first) return null;
  return first.localizedName ?? first.name ?? ([first.city, first.state, first.country].filter(Boolean).join(", ") || null);
}

export async function discoverCornerstone(config: CornerstoneConfig, fetcher: typeof fetch = fetch): Promise<string[]> {
  const context = await getContext(config, fetcher);
  const endpoint = new URL("rec-job-search/external/jobs", context.endpoints.cloud).toString();
  const links = new Set<string>();
  for (let page = 1; page <= config.maxPages; page++) {
    const body = {
      careerSiteId: config.siteId,
      careerSitePageId: config.siteId,
      pageNumber: page,
      pageSize: config.pageSize,
      cultureId: context.cultureID,
      cultureName: context.cultureName,
      searchText: "",
      states: [],
      countryCodes: [],
      cities: [],
      placeID: "",
      radius: "",
      postingsWithinDays: "",
      customFieldCheckboxKeys: [],
      customFieldDropdowns: [],
      customFieldRadios: [],
    };
    const res = await fetcher(endpoint, { method: "POST", headers: authHeaders(context), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Cornerstone job search returned HTTP ${res.status}`);
    const data = (await res.json()) as CornerstoneSearchResponse;
    const postings = data.data?.requisitions ?? [];
    for (const posting of postings) {
      if (posting.requisitionId != null) {
        links.add(`${origin(config.host)}/ux/ats/careersite/${config.siteId}/requisition/${posting.requisitionId}?c=${encodeURIComponent(config.corp)}`);
      }
    }
    const seen = page * config.pageSize;
    if (postings.length < config.pageSize || seen >= (data.data?.totalCount ?? 0)) break;
  }
  return [...links];
}

export async function acquireCornerstone(
  url: URL,
  config: CornerstoneConfig,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const match = url.pathname.match(/\/requisition\/([^/]+)/);
  if (!match) throw new Error("Unrecognized Cornerstone requisition URL.");
  const context = await getContext(config, fetcher);
  const endpoint = `${origin(config.host)}/services/x/job-requisition/v2/requisitions/${encodeURIComponent(match[1])}/jobDetails?cultureId=${context.cultureID}`;
  const res = await fetcher(endpoint, { headers: authHeaders(context) });
  if (!res.ok) throw new Error(`Cornerstone job detail returned HTTP ${res.status}`);
  const response = (await res.json()) as { data?: CornerstoneDetail };
  const job = (response.data ?? response) as CornerstoneDetail;
  if (!job?.displayTitle) throw new Error("Cornerstone detail did not include a job title.");
  const location = job.primaryLocation;
  return jobPostingHtml({
    title: job.displayTitle,
    company: config.companyName,
    location: location?.locationDisplayTitle ?? location?.title ?? [location?.city, location?.state, location?.country].filter(Boolean).join(", "),
    description: job.externalDescription ?? job.jobAd,
    applyUrl: url.toString(),
  });
}

export function cornerstoneLocationForTest(posting: CornerstoneRequisition): string | null {
  return displayLocation(posting.locations);
}
