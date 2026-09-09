"use client";

import { LinkButton } from "@/components/ui/Button";

export function ApplyLink({ href, jobId, title, category }: { href: string; jobId: string; title: string; category: string }) {
  function measure() {
    const analytics = window as typeof window & { gtag?: (...args: unknown[]) => void };
    analytics.gtag?.("event", "apply_click", {
      job_id: jobId,
      job_title: title,
      opportunity_category: category,
      transport_type: "beacon",
    });
  }

  return <LinkButton href={href} target="_blank" rel="noopener noreferrer" onClick={measure}>Apply now</LinkButton>;
}
