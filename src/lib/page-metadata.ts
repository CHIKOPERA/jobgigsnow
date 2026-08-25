import "server-only";
import type { Metadata } from "next";
import { site } from "@/config";

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `${site.url.replace(/\/$/, "")}${path}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${site.url.replace(/\/$/, "")}${path}`,
      siteName: site.name,
    },
  };
}
