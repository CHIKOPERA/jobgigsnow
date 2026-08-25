import { InfoPage } from "@/components/content/InfoPage";
import { env } from "@/config";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata(
  "/terms",
  "Terms of use",
  "The terms that apply when accessing and using JobGigsNow.",
);

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of use"
      intro="By using JobGigsNow, you agree to these terms. If you do not agree, please do not use the service. Last updated 25 August 2026."
    >
      <h2>What the service provides</h2>
      <p>
        JobGigsNow is an independent information and discovery service. We organise public opportunities, publish editorial guidance and link to third-party organisations. We are not the employer, recruiter, training provider or funder unless a page expressly says otherwise.
      </p>

      <h2>No guarantee of an outcome</h2>
      <p>
        We work to keep information clear and current, but do not guarantee that every listing is complete, error-free or still available. An organisation may change or withdraw an opportunity without notice. Confirm all requirements, costs, deadlines and application instructions on the official destination before acting. Use of the site does not guarantee admission, funding, employment or an interview.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You may use the site for lawful personal opportunity discovery. You must not interfere with the service, attempt unauthorised access, submit malicious content, misuse another person’s account, or scrape the site at a rate that harms availability. Content may not be republished as a competing database without permission.
      </p>

      <h2>Accounts and external links</h2>
      <p>
        You are responsible for activity associated with your account and for keeping access methods secure. External websites have their own terms, privacy practices and security. A link does not mean we control or guarantee the destination.
      </p>

      <h2>Changes and availability</h2>
      <p>
        We may change, suspend or discontinue parts of the service and may update these terms when the service or applicable requirements change. The updated date above will show the latest revision.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to <a href={`mailto:${env.CONTACT_EMAIL}`}>{env.CONTACT_EMAIL}</a>.
      </p>
    </InfoPage>
  );
}
