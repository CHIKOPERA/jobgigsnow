import "server-only";
import { env } from "@/config/env";

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  alt: string;
  photographer: string;
  photographer_url: string;
  src: { large2x: string; large: string; medium: string };
}

export async function searchPexels(query: string, perPage = 12) {
  if (!env.PEXELS_API_KEY) throw new Error("Pexels image search is not configured.");
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query.slice(0, 160));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", "landscape");
  const response = await fetch(url, {
    headers: { Authorization: env.PEXELS_API_KEY },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Pexels returned ${response.status}.`);
  const data = await response.json() as { photos: PexelsPhoto[] };
  return data.photos.map((photo) => ({
    id: photo.id,
    width: photo.width,
    height: photo.height,
    url: photo.src.large2x || photo.src.large,
    thumbnail: photo.src.medium,
    alt: photo.alt || query,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
  }));
}
