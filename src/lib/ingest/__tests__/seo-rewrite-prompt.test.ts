import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSeoRewritePrompt,
  renderSeoRewritePrompt,
  seoRewriteGroundingError,
  type SeoRewriteContext,
} from "../seo-rewrite-prompt";

function ctx(overrides: Partial<SeoRewriteContext> = {}): SeoRewriteContext {
  return {
    title: "Forklift Operator",
    companyName: "Testco Logistics",
    location: "Austin, TX",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    description: "Operate a forklift safely.",
    tags: ["forklift", "warehouse"],
    applyUrl: "https://testco.example/jobs/forklift-operator",
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

test("buildSeoRewritePrompt appends facts omitted by a custom instruction-only template", () => {
  const result = buildSeoRewritePrompt("Write a detailed SEO article.", ctx());
  assert.match(result, /Authoritative job input/);
  assert.match(result, /Job title: Forklift Operator/);
  assert.match(result, /Company: Testco Logistics/);
  assert.match(result, /Source description: Operate a forklift safely\./);
  assert.match(result, /Application URL: https:\/\/testco\.example\/jobs\/forklift-operator/);
});

test("buildSeoRewritePrompt does not duplicate fields already included by placeholders", () => {
  const result = buildSeoRewritePrompt("Role: {{title}}\nBody: {{description}}", ctx());
  assert.equal(result.match(/Forklift Operator/g)?.length, 1);
  assert.equal(result.match(/Operate a forklift safely\./g)?.length, 1);
  assert.match(result, /Company: Testco Logistics/);
});

test("grounding rejects a rewrite about a different job and organization", () => {
  const error = seoRewriteGroundingError(ctx(), {
    title: "Integrated Services Management Specialist at WHO",
    descriptionHtml: "<p>The World Health Organization is hiring in Geneva.</p>",
  });
  assert.match(error ?? "", /title is not grounded/);
});

test("grounding rejects links other than the source application URL", () => {
  const error = seoRewriteGroundingError(ctx(), {
    title: "Forklift Operator at Testco Logistics",
    descriptionHtml: '<p>Testco Logistics is hiring. <a href="https://other.example/apply">Apply</a></p>',
  });
  assert.match(error ?? "", /link that was not present/);
});

test("grounding accepts a source-faithful rewrite", () => {
  const error = seoRewriteGroundingError(ctx(), {
    title: "Forklift Operator at Testco Logistics",
    descriptionHtml:
      '<p>Testco Logistics needs a safe forklift operator.</p><a href="https://testco.example/jobs/forklift-operator">Apply</a>',
  });
  assert.equal(error, null);
});
