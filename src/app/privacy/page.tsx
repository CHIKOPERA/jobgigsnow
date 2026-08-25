import { InfoPage } from "@/components/content/InfoPage";
import { env } from "@/config";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata(
  "/privacy",
  "Privacy policy",
  "How JobGigsNow collects, uses and protects information when you use the site.",
);

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      intro="This policy explains what information JobGigsNow processes, why we use it and the choices available to you. Last updated 25 August 2026."
    >
      <h2>Information you provide</h2>
      <p>
        If you sign in, our authentication provider processes the account details needed to identify your session. We store the identifier supplied by that provider with actions such as saved jobs, saved searches or alert preferences. If you email us, we receive the address, message and attachments you choose to send.
      </p>

      <h2>Information collected automatically</h2>
      <p>
        Our hosting and security providers may process request information such as IP address, browser type, requested URL, time and diagnostic logs. Google Analytics may measure visits and interactions. Where advertising is enabled, Google AdSense may use cookies or similar technologies to deliver, limit and measure ads according to your consent choices and Google’s policies.
      </p>

      <h2>How information is used</h2>
      <ul>
        <li>Provide sign-in, saved-item and alert features you request.</li>
        <li>Operate, secure, troubleshoot and improve the service.</li>
        <li>Understand aggregate usage and content performance.</li>
        <li>Respond to questions, corrections and privacy requests.</li>
        <li>Comply with legal obligations and prevent abuse.</li>
      </ul>

      <h2>Sharing and retention</h2>
      <p>
        We use service providers for hosting, authentication, analytics and advertising. They process information for those services under their own terms and applicable agreements. We do not sell personal information. We retain data only as long as needed for the purposes above, legal obligations and legitimate security records.
      </p>

      <h2>Your choices</h2>
      <p>
        You can avoid optional account features, remove saved items, adjust browser cookie controls and use Google’s advertising settings where available. You may ask to access, correct or delete personal information associated with your account, subject to applicable law and necessary verification.
      </p>

      <h2>Contact</h2>
      <p>
        Send privacy questions or requests to <a href={`mailto:${env.CONTACT_EMAIL}`}>{env.CONTACT_EMAIL}</a>.
      </p>
    </InfoPage>
  );
}
