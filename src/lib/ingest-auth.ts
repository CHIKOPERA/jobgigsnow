import "server-only";
import { ingest } from "@/config/ingest";

export function isAuthorizedIngestRequest(request: Request): boolean {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length).trim();
  return token === ingest.token;
}
