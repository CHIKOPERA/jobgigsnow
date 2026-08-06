import { createSource, listSources } from "@/lib/ingest/source-service";
import { isAuthorizedIngestRequest } from "@/lib/ingest-auth";
import { errorResponse } from "@/lib/validation/common";
import { createSourceSchema, listSourcesQuerySchema } from "@/lib/validation/source";

export async function GET(request: Request) {
  if (!isAuthorizedIngestRequest(request)) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid bearer token.", 401);
  }

  const url = new URL(request.url);
  const parsed = listSourcesQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse("INVALID_QUERY", parsed.error.issues[0]?.message ?? "Invalid query.", 400);
  }

  const sources = await listSources(parsed.data.enabled);
  return Response.json({ sources });
}

export async function POST(request: Request) {
  if (!isAuthorizedIngestRequest(request)) {
    return errorResponse("UNAUTHORIZED", "Missing or invalid bearer token.", 401);
  }

  const json = await request.json().catch(() => null);
  const parsed = createSourceSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  const source = await createSource(parsed.data);
  return Response.json(source, { status: 201 });
}
