"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readImportProgress } from "./read-import-progress";

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
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setState("pending");
    setMessage(null);
    try {
      const res = await fetch(url, { method });
      const json = await readImportProgress<{ published?: number; skipped?: number; failed?: number } | null>(res, (event) => {
        setMessage(event.message);
      }, "The action could not be completed.");
      if (json && typeof json.published === "number") {
        setMessage(`Published ${json.published}. Skipped ${json.skipped ?? 0}. Failed ${json.failed ?? 0}.`);
      }
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "pending"}
        className="focus-ring flex h-10 items-center rounded-pill bg-ink px-4 text-meta font-medium text-surface transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        style={{ transitionDuration: "var(--dur-state)" }}
      >
        {state === "pending" ? pendingLabel : state === "error" ? "Failed — try again" : label}
      </button>
      {message && <span aria-live="polite" className="text-[11px] leading-snug text-ink-muted">{message}</span>}
    </div>
  );
}
