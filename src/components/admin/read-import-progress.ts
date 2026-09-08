import type { ImportProgressEvent, ImportStreamEvent } from "@/lib/ingest/progress-types";

async function responseError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  return payload?.error?.message ?? fallback;
}

export async function readImportProgress<T>(
  response: Response,
  onProgress: (event: ImportProgressEvent) => void,
  fallbackError: string,
): Promise<T> {
  if (!response.ok) throw new Error(await responseError(response, fallbackError));

  if (!response.headers.get("content-type")?.includes("application/x-ndjson") || !response.body) {
    return response.json() as Promise<T>;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | undefined;

  const consumeLine = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as ImportStreamEvent<T>;
    if (event.type === "progress") onProgress(event);
    if (event.type === "complete") result = event.result;
    if (event.type === "error") throw new Error(event.message);
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) consumeLine(line);
    if (done) break;
  }
  if (buffer) consumeLine(buffer);
  if (result === undefined) throw new Error("The import ended without a result.");
  return result;
}
