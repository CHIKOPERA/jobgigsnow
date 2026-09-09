import "server-only";
import { GoogleAuth } from "google-auth-library";
import { env, site } from "@/config";
import { isoDateDaysAgo } from "./time";

interface GoogleRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
  metricValues?: Array<{ value?: string }>;
}

interface SearchResponse { rows?: GoogleRow[] }
interface AnalyticsResponse { rows?: GoogleRow[] }

export interface CollectedGoogleMetrics {
  measuredDate: string;
  pageViews: number | null;
  activeUsers: number | null;
  engagedSessions: number | null;
  applyClicks: number | null;
  searchClicks: number | null;
  searchImpressions: number | null;
  searchCtr: number | null;
  searchPosition: number | null;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  speed: Record<string, number> | null;
  integrations: Record<string, { connected: boolean; error?: string }>;
}

function credentialsAvailable() {
  return Boolean(env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

function createAuth(scopes: string[]) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) return null;
  return new GoogleAuth({
    credentials: {
      client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes,
  });
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 240) : "The provider request failed.";
}

async function collectAnalytics(result: CollectedGoogleMetrics) {
  if (!credentialsAvailable() || !env.GOOGLE_ANALYTICS_PROPERTY_ID) return;
  try {
    const auth = createAuth(["https://www.googleapis.com/auth/analytics.readonly"]);
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${env.GOOGLE_ANALYTICS_PROPERTY_ID}:runReport`;
    const response = await auth!.request<AnalyticsResponse>({
      url,
      method: "POST",
      data: {
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "engagedSessions" }],
      },
    });
    const values = response.data.rows?.[0]?.metricValues ?? [];
    result.pageViews = Number(values[0]?.value ?? 0);
    result.activeUsers = Number(values[1]?.value ?? 0);
    result.engagedSessions = Number(values[2]?.value ?? 0);

    const applyResponse = await auth!.request<AnalyticsResponse>({
      url,
      method: "POST",
      data: {
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: { fieldName: "eventName", stringFilter: { value: "apply_click", matchType: "EXACT" } },
        },
      },
    });
    result.applyClicks = Number(applyResponse.data.rows?.[0]?.metricValues?.[0]?.value ?? 0);
    result.integrations.analytics = { connected: true };
  } catch (error) {
    result.integrations.analytics = { connected: false, error: safeError(error) };
  }
}

async function collectSearch(result: CollectedGoogleMetrics) {
  if (!credentialsAvailable() || !env.GOOGLE_SEARCH_CONSOLE_SITE_URL) return;
  try {
    const auth = createAuth(["https://www.googleapis.com/auth/webmasters.readonly"]);
    const property = encodeURIComponent(env.GOOGLE_SEARCH_CONSOLE_SITE_URL);
    const response = await auth!.request<SearchResponse>({
      url: `https://www.googleapis.com/webmasters/v3/sites/${property}/searchAnalytics/query`,
      method: "POST",
      data: {
        startDate: result.measuredDate,
        endDate: result.measuredDate,
        dimensions: ["page"],
        rowLimit: 100,
        dataState: "final",
      },
    });
    const rows = response.data.rows ?? [];
    result.searchClicks = rows.reduce((sum, row) => sum + (row.clicks ?? 0), 0);
    result.searchImpressions = rows.reduce((sum, row) => sum + (row.impressions ?? 0), 0);
    result.searchCtr = result.searchImpressions > 0 ? result.searchClicks / result.searchImpressions : 0;
    result.searchPosition = result.searchImpressions > 0
      ? rows.reduce((sum, row) => sum + (row.position ?? 0) * (row.impressions ?? 0), 0) / result.searchImpressions
      : 0;
    result.topPages = rows.slice(0, 25).map((row) => ({
      page: row.keys?.[0] ?? "",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }));
    result.integrations.searchConsole = { connected: true };
  } catch (error) {
    result.integrations.searchConsole = { connected: false, error: safeError(error) };
  }
}

async function collectSpeed(result: CollectedGoogleMetrics) {
  if (!env.GOOGLE_PAGESPEED_API_KEY) return;
  try {
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", site.url);
    endpoint.searchParams.set("strategy", "mobile");
    endpoint.searchParams.set("category", "performance");
    endpoint.searchParams.set("key", env.GOOGLE_PAGESPEED_API_KEY);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(45_000) });
    if (!response.ok) throw new Error(`PageSpeed returned HTTP ${response.status}.`);
    const body = await response.json() as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number } };
        audits?: Record<string, { numericValue?: number }>;
      };
    };
    const lighthouse = body.lighthouseResult;
    result.speed = {
      performance: Math.round((lighthouse?.categories?.performance?.score ?? 0) * 100),
      lcpMs: Math.round(lighthouse?.audits?.["largest-contentful-paint"]?.numericValue ?? 0),
      cls: Number((lighthouse?.audits?.["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
      tbtMs: Math.round(lighthouse?.audits?.["total-blocking-time"]?.numericValue ?? 0),
    };
    result.integrations.pageSpeed = { connected: true };
  } catch (error) {
    result.integrations.pageSpeed = { connected: false, error: safeError(error) };
  }
}

export async function collectGoogleMetrics(date = new Date()): Promise<CollectedGoogleMetrics> {
  const result: CollectedGoogleMetrics = {
    measuredDate: isoDateDaysAgo(3, date),
    pageViews: null,
    activeUsers: null,
    engagedSessions: null,
    applyClicks: null,
    searchClicks: null,
    searchImpressions: null,
    searchCtr: null,
    searchPosition: null,
    topPages: [],
    speed: null,
    integrations: {
      analytics: { connected: false },
      searchConsole: { connected: false },
      pageSpeed: { connected: false },
    },
  };

  await Promise.all([collectAnalytics(result), collectSearch(result), collectSpeed(result)]);
  return result;
}
