import assert from "node:assert/strict";
import test from "node:test";
import { readImportProgress } from "@/components/admin/read-import-progress";
import type { ImportProgressEvent } from "../ingest/progress-types";

test("reads streamed progress events and returns the completion result", async () => {
  const progress: ImportProgressEvent = {
    type: "progress",
    stage: "rewriting",
    message: "Rewriting job 2 of 4…",
    found: 4,
    processed: 1,
    published: 1,
    skipped: 0,
    failed: 0,
    current: 2,
    total: 4,
  };
  const body = `${JSON.stringify(progress)}\n${JSON.stringify({ type: "complete", result: { published: 3 } })}\n`;
  const events: ImportProgressEvent[] = [];
  const result = await readImportProgress<{ published: number }>(
    new Response(body, { headers: { "Content-Type": "application/x-ndjson" } }),
    (event) => events.push(event),
    "Import failed",
  );

  assert.deepEqual(events, [progress]);
  assert.deepEqual(result, { published: 3 });
});

test("surfaces an error sent after a stream has started", async () => {
  const body = `${JSON.stringify({ type: "error", message: "Jina could not capture the page." })}\n`;
  await assert.rejects(
    readImportProgress(new Response(body, { headers: { "Content-Type": "application/x-ndjson" } }), () => {}, "Import failed"),
    /Jina could not capture/,
  );
});
