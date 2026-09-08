import "server-only";
import type { ImportProgressReporter, ImportStreamEvent } from "./progress-types";

/** Streams newline-delimited JSON so one serverless request can perform work and report progress. */
export function progressStreamResponse<T>(work: (report: ImportProgressReporter) => Promise<T>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (event: ImportStreamEvent<T>) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };

      try {
        const result = await work((event) => send(event));
        send({ type: "complete", result });
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : "The import failed." });
      } finally {
        if (open) controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
