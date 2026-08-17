import "server-only";
import { env } from "@/config/env";

interface LightpandaResponse {
  data: string;
  status: number;
  headers?: Record<string, string>;
}

/** Whether a Lightpanda Cloud API token is configured. */
export function isLightpandaConfigured(): boolean {
  return !!env.LIGHTPANDA_API_TOKEN;
}

/**
 * Fetches a URL via Lightpanda Cloud — executes JavaScript and waits for the page to settle
 * before returning the rendered HTML. Use this for detail pages on sources whose crawlConfig
 * sets `jsRendering: true` (React/Angular SPAs that return an empty shell on a plain fetch).
 *
 * Docs: https://lightpanda.io/docs/usage/api
 */
export async function fetchWithLightpanda(url: string): Promise<{ html: string; httpStatus: number }> {
  if (!env.LIGHTPANDA_API_TOKEN) throw new Error("LIGHTPANDA_API_TOKEN is not set.");

  const res = await fetch("https://euwest.cloud.lightpanda.io/api/fetch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LIGHTPANDA_API_TOKEN}`,
    },
    body: JSON.stringify({ url, output_format: "html", wait_event: "networkIdle" }),
    // JS rendering + network idle can take a while; allow 30s.
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Lightpanda Cloud returned HTTP ${res.status}`);
  const json = (await res.json()) as LightpandaResponse;
  if (!json.data) throw new Error("Lightpanda Cloud response contained no HTML.");
  return { html: json.data, httpStatus: json.status };
}
