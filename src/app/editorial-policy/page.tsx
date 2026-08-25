import { InfoPage } from "@/components/content/InfoPage";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata(
  "/editorial-policy",
  "Editorial policy",
  "The sourcing, review, correction and advertising standards used by JobGigsNow.",
);

export default function EditorialPolicyPage() {
  return (
    <InfoPage
      title="Editorial policy"
      intro="Our goal is to make opportunities easier to understand while preserving the facts applicants need to verify and act on them."
    >
      <h2>How listings are sourced</h2>
      <p>
        We monitor public employer, institution and programme pages. Each listing identifies an external application destination when one is available. We do not treat another aggregator as proof of an opportunity when an authoritative source can be found.
      </p>

      <h2>Editing and review</h2>
      <p>
        Automated tools may help extract, classify and rewrite source material into JobGigsNow’s standard format. Automation does not publish directly. A reviewer checks the organisation, title, location, opportunity type, important requirements, deadline and application link before publication.
      </p>
      <p>
        Editing is intended to improve structure and plain-language readability. It must not invent responsibilities, qualifications, compensation, deadlines or guarantees. When the source is unclear, we omit the uncertain claim or hold the listing for further review.
      </p>

      <h2>Freshness and corrections</h2>
      <p>
        We track whether source listings remain available and close or archive opportunities that are no longer current. A source can change between checks, so applicants should confirm deadlines and requirements on the official page. Substantive corrections are made as soon as they can be verified.
      </p>

      <h2>Original guidance</h2>
      <p>
        Career articles are selected for a specific reader need and should provide actionable explanation, examples or context beyond a list of generic tips. Sources are credited when reporting depends on external research or official guidance.
      </p>

      <h2>Advertising independence</h2>
      <p>
        Advertising does not determine which opportunities or advice we publish. Ads are labelled and kept away from searches, saved-job screens, empty states, errors, sign-in experiences and policy pages. A commercial relationship does not buy favourable editorial treatment.
      </p>
    </InfoPage>
  );
}
