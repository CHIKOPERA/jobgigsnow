import { cache } from "@/config/cache";
import { getFilterFacets } from "@/lib/job-query";
import { filterFacetsSchema } from "@/lib/validation/filters";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = filterFacetsSchema.parse(await getFilterFacets());

  return Response.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${cache.filtersRevalidateSeconds}, stale-while-revalidate=60`,
    },
  });
}
