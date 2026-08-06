"use client";

import { useState } from "react";
import type { JobListResponse } from "@/lib/validation/job";
import { Button } from "@/components/ui/Button";
import { JobList } from "./JobList";

interface LoadMoreJobsProps {
  initialCursor: string | null;
  queryString: string;
  detailBasePath: string;
}

export function LoadMoreJobs({ initialCursor, queryString, detailBasePath }: LoadMoreJobsProps) {
  const [jobs, setJobs] = useState<JobListResponse["jobs"]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  if (!cursor && jobs.length === 0) return null;

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams(queryString);
      params.set("cursor", cursor!);
      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data: JobListResponse = await res.json();
      setJobs((prev) => [...prev, ...data.jobs]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {jobs.length > 0 && (
        <JobList
          jobs={jobs}
          savedJobIds={new Set()}
          detailHref={(slug) => `${detailBasePath}/${slug}?${queryString}`}
        />
      )}
      {cursor && (
        <Button variant="secondary" onClick={loadMore} loading={loading} fullWidthBelowMd={false}>
          {loading ? "Loading…" : "Load more jobs"}
        </Button>
      )}
    </div>
  );
}
