"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ActionButtonProps {
  label: string;
  pendingLabel: string;
  method: "POST";
  url: string;
}

/** A button that POSTs to an admin API route and refreshes the current page's server data on
 *  success — backs "Run now" and "Reprocess" across the admin UI. */
export function ActionButton({ label, pendingLabel, method, url }: ActionButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "pending" | "error">("idle");

  async function handleClick() {
    setState("pending");
    try {
      const res = await fetch(url, { method });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "pending"}
      className="focus-ring flex h-10 items-center rounded-pill bg-ink px-4 text-meta font-medium text-surface transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
      style={{ transitionDuration: "var(--dur-state)" }}
    >
      {state === "pending" ? pendingLabel : state === "error" ? "Failed — try again" : label}
    </button>
  );
}
