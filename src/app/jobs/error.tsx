"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function JobsError({ error, retry }: { error: Error; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center" role="alert">
      <h1 className="text-title font-semibold">Something went wrong loading jobs</h1>
      <p className="mt-2 text-body text-ink-muted">Give it another try in a moment.</p>
      <div className="mt-6 flex justify-center">
        <Button onClick={retry} fullWidthBelowMd={false}>
          Try again
        </Button>
      </div>
    </div>
  );
}
