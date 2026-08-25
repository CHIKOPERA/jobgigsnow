import { test } from "node:test";
import assert from "node:assert/strict";
import { discoverWorkday } from "../workday";
import type { CrawlConfig } from "@/lib/validation/source";

type WorkdayConfig = Extract<CrawlConfig, { provider: "workday" }>;

const config: WorkdayConfig = {
  provider: "workday",
  host: "example.wd3.myworkdayjobs.com",
  tenant: "example",
  site: "Careers",
  pageSize: 20,
  maxPages: 10,
};

test("continues paging when Workday only reports total on the first response", async () => {
  const offsets: number[] = [];
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const offset = JSON.parse(String(init?.body)).offset as number;
    offsets.push(offset);
    const count = offset < 40 ? 20 : 7;
    return Response.json({
      total: offset === 0 ? 47 : 0,
      jobPostings: Array.from({ length: count }, (_, index) => ({
        externalPath: `/job/Location/Role-${offset + index}`,
      })),
    });
  }) as typeof fetch;

  const links = await discoverWorkday(config, fetcher);

  assert.equal(links.length, 47);
  assert.deepEqual(offsets, [0, 20, 40]);
});

test("respects maxPages even when every Workday response is full", async () => {
  const fetcher = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const offset = JSON.parse(String(init?.body)).offset as number;
    return Response.json({
      total: 500,
      jobPostings: Array.from({ length: 20 }, (_, index) => ({ externalPath: `/job/Place/Role-${offset + index}` })),
    });
  }) as typeof fetch;

  const links = await discoverWorkday({ ...config, maxPages: 2 }, fetcher);
  assert.equal(links.length, 40);
});
