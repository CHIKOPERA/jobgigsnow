import type { Metadata } from "next";
import { JobsShell } from "./JobsShell";

export const metadata: Metadata = { title: "Jobs" };

interface JobsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  return <JobsShell searchParams={await searchParams} />;
}
