import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLearningInsights, scoreSources } from "../learning-policy";

test("source learning rewards reliability and matches between source history and coverage gaps", () => {
  const scores = scoreSources([
    { id: "a", name: "Reliable finance", runs: 5, discovered: 10, failures: 0, published: 6, coverageMatches: ["Banking & Finance"], specialties: [] },
    { id: "b", name: "Broken jobs", runs: 5, discovered: 10, failures: 8, published: 1, coverageMatches: [], specialties: [] },
  ]);

  assert.equal(scores[0]?.id, "a");
  assert.match(scores[0]?.reason ?? "", /can supply gaps in Banking & Finance/);
  assert.ok((scores[0]?.score ?? 0) > (scores[1]?.score ?? 0));
});

test("learning reports goals and missing measurement without inventing performance", () => {
  const insights = buildLearningInsights({
    pageViews: null,
    dailyViewGoal: 300,
    categoryCounts: { JOB: 8, INTERNSHIP: 2 },
    industryCounts: { TECHNOLOGY: 1, OTHER: 0 },
    categoryMinimum: 5,
    sources: [],
    speed: null,
    integrations: { analytics: { connected: false }, searchConsole: { connected: false } },
  });

  assert.equal(insights.some((item) => item.fingerprint === "traffic:daily-view-goal"), false);
  assert.equal(insights.some((item) => item.fingerprint === "category:INTERNSHIP:coverage"), true);
  assert.equal(insights.some((item) => item.fingerprint === "industry:TECHNOLOGY:coverage"), true);
  assert.equal(insights.some((item) => item.fingerprint === "system:measurement-connections"), true);
});
