import type { MetadataRoute } from "next";
import { site } from "@/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = site.url.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
