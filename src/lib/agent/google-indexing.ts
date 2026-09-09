import "server-only";
import { GoogleAuth } from "google-auth-library";
import { env, site } from "@/config";
import { prisma } from "@/lib/prisma";

function authClient() {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) return null;
  return new GoogleAuth({
    credentials: {
      client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
}

export async function notifyGoogleIndexing(agentRunId: string) {
  "use step";
  await prisma.dailyAgentRun.update({ where: { id: agentRunId }, data: { currentStage: "INDEXING" } });
  const auth = authClient();
  if (!auth) return { connected: false, updated: 0, removed: 0, failed: 0 };
  const [updates, removals] = await Promise.all([
    prisma.job.findMany({
      where: { status: "PUBLISHED", indexingNotifiedAt: null },
      orderBy: { publishedAt: "asc" },
      take: 100,
      select: { id: true, slug: true },
    }),
    prisma.job.findMany({
      where: {
        status: { in: ["CLOSED", "ARCHIVED", "REJECTED"] },
        indexingNotifiedAt: { not: null },
        indexingRemovedAt: null,
      },
      take: 100,
      select: { id: true, slug: true },
    }),
  ]);
  let updated = 0;
  let removed = 0;
  let failed = 0;
  for (const [type, jobs] of [["URL_UPDATED", updates], ["URL_DELETED", removals]] as const) {
    for (const job of jobs) {
      try {
        await auth.request({
          url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
          method: "POST",
          data: { url: `${site.url.replace(/\/$/, "")}/jobs/${job.slug}`, type },
        });
        if (type === "URL_UPDATED") {
          await prisma.job.update({ where: { id: job.id }, data: { indexingNotifiedAt: new Date(), indexingRemovedAt: null } });
          updated += 1;
        } else {
          await prisma.job.update({ where: { id: job.id }, data: { indexingRemovedAt: new Date() } });
          removed += 1;
        }
      } catch {
        failed += 1;
      }
    }
  }
  return { connected: true, updated, removed, failed };
}
