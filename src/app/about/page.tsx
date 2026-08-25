import Link from "next/link";
import { InfoPage } from "@/components/content/InfoPage";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata(
  "/about",
  "About JobGigsNow",
  "How JobGigsNow finds, reviews and presents opportunities for job seekers.",
);

export default function AboutPage() {
  return (
    <InfoPage
      title="About JobGigsNow"
      intro="JobGigsNow helps people find current work, training and early-career opportunities without having to decode dozens of employer websites."
    >
      <h2>What makes this site useful</h2>
      <p>
        We bring opportunities into a consistent format, highlight the details that matter to an applicant and link back to the original organisation for the application. Our categories cover jobs, internships, learnerships, apprenticeships, graduate programmes, study funding and calls for applications.
      </p>
      <p>
        A listing is more than a copied vacancy notice. We normalise titles, locations, employment types and closing dates, remove distracting page furniture, and edit descriptions for clarity. Every published opportunity goes through an editorial review before it appears publicly.
      </p>

      <h2>Why come back</h2>
      <p>
        Opportunities change quickly. We add newly reviewed listings, retire unavailable ones and publish practical career guidance designed around the questions applicants actually face. You can also save jobs to revisit later.
      </p>

      <h2>Our limits</h2>
      <p>
        JobGigsNow is an independent discovery service. Unless a page says otherwise, we are not the hiring employer, training provider or funder. Availability and requirements can change after publication, so always confirm the final details on the linked official application page.
      </p>
      <p>
        Learn more about our standards in the <Link href="/editorial-policy">editorial policy</Link>, or <Link href="/contact">contact us</Link> with a correction.
      </p>
    </InfoPage>
  );
}
