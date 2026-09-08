import type { Metadata } from "next";
import { SourceForm } from "@/components/admin/SourceForm";

export const metadata: Metadata = { title: "Admin — New source" };

export default function NewSourcePage() {
  return (
    <div className="flex flex-col gap-6">
      <div><p className="text-label uppercase tracking-[0.1em] text-ink-muted">Automatic imports</p><h1 className="mt-2 text-title font-semibold">Add a careers source</h1><p className="mt-2 max-w-2xl text-body text-ink-muted">Enter the company and its public careers page. We’ll handle the rest.</p></div>
      <SourceForm mode="create" />
    </div>
  );
}
