"use client";

import { useState, useTransition } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";

interface SaveButtonProps {
  jobId: string;
  jobTitle: string;
  initialSaved: boolean;
}

const BASE_CLASSES =
  "focus-ring absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-pill text-[18px] text-ink-muted transition-colors hover:bg-surface-sunk";

export function SaveButton({ jobId, jobTitle, initialSaved }: SaveButtonProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  if (!isLoaded) {
    return <span className={BASE_CLASSES} aria-hidden="true" />;
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className={BASE_CLASSES}
          aria-label={`Sign in to save ${jobTitle}`}
        >
          <span aria-hidden="true">♡</span>
        </button>
      </SignInButton>
    );
  }

  function toggle() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      try {
        const res = await fetch(next ? "/api/saved-jobs" : `/api/saved-jobs/${jobId}`, {
          method: next ? "POST" : "DELETE",
          headers: next ? { "Content-Type": "application/json" } : undefined,
          body: next ? JSON.stringify({ jobId }) : undefined,
        });
        if (!res.ok) throw new Error("Request failed");
      } catch {
        setSaved(!next);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${jobTitle} from saved jobs` : `Save ${jobTitle}`}
      className={[BASE_CLASSES, saved ? "text-accent-mint" : ""].join(" ")}
    >
      <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
    </button>
  );
}
