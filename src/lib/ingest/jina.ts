import "server-only";
import { env } from "@/config/env";
import { sources } from "@/config/sources";
import { assertPublicHttpUrl } from "@/lib/validation/public-url";
import { acquireHostSlot } from "./rate-limiter";
import { readWithJina } from "./jina-client";

export const isJinaEnabled = () => env.JINA_ENABLED;

export async function fetchWithJina(url: string, timeoutMs = 45_000) {
  await assertPublicHttpUrl(url);
  // One shared gate across target domains in this process: anonymous Jina allows 20 RPM.
  const release = await acquireHostSlot("r.jina.ai", 3_100);
  try {
    return await readWithJina(url, {
      apiKey: env.JINA_API_KEY,
      timeoutMs,
      maxBytes: sources.maxHtmlBytes,
      userAgent: sources.defaultUserAgent,
    });
  } finally {
    release();
  }
}
