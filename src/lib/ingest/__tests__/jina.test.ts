import assert from "node:assert/strict";
import test from "node:test";
import { readWithJina } from "../jina-client";

const options = { timeoutMs: 1000, maxBytes: 1000, userAgent: "JobGigsNowBot" };
const page = {
  title: "Developer <Remote>",
  url: "https://example.com/job",
  content: "Build software.\n\n[Apply](https://example.com/apply)",
  httpStatus: 200,
};

test("anonymous requests preserve routes and pass source Markdown to the pipeline", async () => {
  const result = await readWithJina("https://example.com/#/job", options, async (url, init) => {
    assert.equal(url, "https://r.jina.ai/");
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { url: "https://example.com/#/job" });
    const headers = new Headers(init?.headers);
    assert.equal(headers.has("authorization"), false);
    assert.equal(headers.get("x-robots-txt"), options.userAgent);
    return Response.json({ data: page });
  });
  assert.equal(result.markdown, page.content);
  assert.match(result.html, /Developer &lt;Remote&gt;/);
  assert.equal(result.redirectedUrl, page.url);
});

test("optional authentication is sent only to Jina", async () => {
  await readWithJina(page.url, { ...options, apiKey: "test-key" }, async (url, init) => {
    assert.equal(url, "https://r.jina.ai/");
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-key");
    assert.equal(init?.redirect, "error");
    return Response.json({ data: page });
  });
});

test("source errors and challenge pages cannot become job content", async () => {
  for (const data of [
    { ...page, httpStatus: 403 },
    { ...page, title: "Just a moment..." },
    { ...page, content: "  " },
  ]) {
    await assert.rejects(readWithJina(page.url, options, async () => Response.json({ data })));
  }
});

test("reports quota errors without exposing provider response bodies", async () => {
  await assert.rejects(
    readWithJina(page.url, options, async () => new Response("sensitive provider error", { status: 429 })),
    (error: Error) => /request limit/.test(error.message) && !error.message.includes("sensitive"),
  );
});

test("bounds captured content", async () => {
  const result = await readWithJina(page.url, { ...options, maxBytes: 5 }, async () => Response.json({ data: page }));
  assert.equal(result.markdown, "Build");
  assert.equal(result.htmlTruncated, true);
});
