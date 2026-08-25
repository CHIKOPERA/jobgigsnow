import { InfoPage } from "@/components/content/InfoPage";
import { env } from "@/config";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata(
  "/contact",
  "Contact",
  "Contact JobGigsNow about corrections, feedback, privacy questions or partnerships.",
);

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact"
      intro="Send us a note about a listing, an editorial correction, a privacy request or a general question."
    >
      <h2>Email</h2>
      <p>
        Write to <a href={`mailto:${env.CONTACT_EMAIL}`}>{env.CONTACT_EMAIL}</a>. Please use a clear subject line and include the URL of any page you are asking about.
      </p>

      <h2>Reporting an issue</h2>
      <p>
        For an expired, misleading or incorrect opportunity, include the listing URL, the detail that appears wrong and, when possible, a link to the organisation’s official notice. We prioritise corrections that could affect an applicant’s eligibility, deadline or safety.
      </p>

      <h2>Recruitment and applications</h2>
      <p>
        We cannot submit an application, promise an interview or answer on behalf of an employer. Use the “Apply now” or “Enroll” link on the relevant detail page to reach the organisation responsible for the opportunity.
      </p>
    </InfoPage>
  );
}
