import { test } from "node:test";
import assert from "node:assert/strict";
import { assertPublicHttpUrl } from "../validation/public-url";

test("one-off crawling rejects localhost", async () => {
  await assert.rejects(() => assertPublicHttpUrl("http://localhost:3000/job"), /private network/i);
});

test("one-off crawling rejects private IP addresses", async () => {
  await assert.rejects(() => assertPublicHttpUrl("https://127.0.0.1/job"), /private network/i);
  await assert.rejects(() => assertPublicHttpUrl("https://10.20.30.40/job"), /private network/i);
});

test("one-off crawling rejects embedded credentials", async () => {
  await assert.rejects(() => assertPublicHttpUrl("https://user:pass@example.com/job"), /embedded credentials/i);
});
