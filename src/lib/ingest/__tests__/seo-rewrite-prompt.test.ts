import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSeoRewritePrompt, type SeoRewriteContext } from "../seo-rewrite-prompt";

function ctx(overrides: Partial<SeoRewriteContext> = {}): SeoRewriteContext {
  return {
    title: "Forklift Operator",
    companyName: "Testco Logistics",
    location: "Austin, TX",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    description: "Operate a forklift safely.",
    tags: ["forklift", "warehouse"],
    ...overrides,
  };
}

test("substitutes every known placeholder", () => {
  const template =
    "{{title}} at {{company}} in {{location}} ({{remoteType}}, {{employmentType}}): {{description}} [{{tags}}]";
  const result = renderSeoRewritePrompt(template, ctx());
  assert.equal(
    result,
    "Forklift Operator at Testco Logistics in Austin, TX (ONSITE, FULL_TIME): Operate a forklift safely. [forklift, warehouse]",
  );
});

test("replaces every occurrence when a placeholder appears more than once", () => {
  const result = renderSeoRewritePrompt("{{title}} / {{title}}", ctx({ title: "Warehouse Associate" }));
  assert.equal(result, "Warehouse Associate / Warehouse Associate");
});

test("joins an empty tags array to an empty string rather than leaving the placeholder", () => {
  const result = renderSeoRewritePrompt("Tags: {{tags}}", ctx({ tags: [] }));
  assert.equal(result, "Tags: ");
});

test("leaves an unrecognized placeholder untouched instead of dropping it silently", () => {
  const result = renderSeoRewritePrompt("{{title}} {{totallyUnknown}}", ctx());
  assert.equal(result, "Forklift Operator {{totallyUnknown}}");
});

test("a template with no placeholders at all is returned unchanged", () => {
  const result = renderSeoRewritePrompt("Just a static instruction.", ctx());
  assert.equal(result, "Just a static instruction.");
});
