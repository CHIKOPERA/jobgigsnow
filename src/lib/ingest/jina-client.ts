import { z } from "zod";

const responseSchema = z.object({
  data: z.object({
    title: z.string().default(""),
    url: z.url(),
    content: z.string().trim().min(1, "Jina returned no page content."),
    httpStatus: z.number().int().optional(),
  }),
});

export class JinaError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "JinaError";
  }
}

function escapeHtml(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

/** Pure HTTP adapter; configuration and request pacing live in jina.ts. */
export async function readWithJina(
  url: string,
  options: { apiKey?: string; timeoutMs: number; maxBytes: number; userAgent: string },
  fetcher: typeof fetch = fetch,
) {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Robots-Txt": options.userAgent,
    "X-Retain-Images": "none",
  });
  if (options.apiKey) headers.set("Authorization", `Bearer ${options.apiKey}`);
  // POST preserves hash-based job routes and keeps target query strings out of the API URL.
  const response = await fetcher("https://r.jina.ai/", {
    method: "POST",
    headers,
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(options.timeoutMs),
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok) {
    const hint = response.status === 401 ? "Set JINA_API_KEY to enable access."
      : response.status === 429 ? "Jina's request limit was reached; try again later."
      : "The page could not be captured.";
    throw new JinaError(`Jina returned HTTP ${response.status}. ${hint}`, response.status);
  }
  const { data } = responseSchema.parse(await response.json());
  if (data.httpStatus && data.httpStatus >= 400) {
    throw new JinaError(`Source page returned HTTP ${data.httpStatus} through Jina.`, data.httpStatus);
  }
  if (/^(access denied|just a moment|verify you are human|attention required|robot check|captcha)(\b|[.!])/i.test(data.title.trim())) {
    throw new JinaError("Jina captured a blocked page instead of job details.", 403);
  }
  const bytes = Buffer.from(data.content);
  const truncated = bytes.length > options.maxBytes;
  const markdown = truncated ? bytes.subarray(0, options.maxBytes).toString("utf8") : data.content;
  return {
    // Keep the existing extraction bundle compatible; the original Markdown goes directly to AI.
    html: `<!doctype html><html><head><title>${escapeHtml(data.title)}</title></head><body><article><h1>${escapeHtml(data.title)}</h1><pre>${escapeHtml(markdown)}</pre></article></body></html>`,
    markdown,
    htmlTruncated: truncated,
    httpStatus: data.httpStatus ?? 200,
    redirectedUrl: data.url !== url ? data.url : null,
    fetchedAt: new Date().toISOString(),
  };
}
