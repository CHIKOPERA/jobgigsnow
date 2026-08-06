import { requireAdmin, adminAuthErrorResponse } from "@/lib/admin-auth";
import { env } from "@/config/env";
import { errorResponse } from "@/lib/validation/common";

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  alt: string;
  photographer: string;
  photographer_url: string;
  src: { large2x: string; large: string; medium: string };
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return adminAuthErrorResponse(admin.reason);

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return errorResponse("INVALID_QUERY", "Enter an image search.", 400);
  if (!env.PEXELS_API_KEY) return errorResponse("NOT_CONFIGURED", "Pexels image search is not configured.", 503);

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query.slice(0, 160));
    url.searchParams.set("per_page", "12");
    url.searchParams.set("orientation", "landscape");
    const response = await fetch(url, {
      headers: { Authorization: env.PEXELS_API_KEY },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Pexels returned ${response.status}.`);
    const data = await response.json() as { photos: PexelsPhoto[] };
    return Response.json({
      photos: data.photos.map((photo) => ({
        id: photo.id,
        width: photo.width,
        height: photo.height,
        url: photo.src.large2x || photo.src.large,
        thumbnail: photo.src.medium,
        alt: photo.alt || query,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
      })),
    });
  } catch (error) {
    return errorResponse("PEXELS_FAILED", error instanceof Error ? error.message : "Pexels search failed.", 502);
  }
}
