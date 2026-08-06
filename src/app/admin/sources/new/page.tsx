import type { Metadata } from "next";
import { SourceForm } from "@/components/admin/SourceForm";

export const metadata: Metadata = { title: "Admin — New source" };

export default function NewSourcePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-title font-semibold">New source</h1>
      <SourceForm mode="create" />
    </div>
  );
}
