import "server-only";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getSavedJobIds(jobIds: string[]): Promise<Set<string>> {
  if (jobIds.length === 0) return new Set();
  const { userId } = await auth();
  if (!userId) return new Set();

  const saved = await prisma.savedJob.findMany({
    where: { userId, jobId: { in: jobIds } },
    select: { jobId: true },
  });
  return new Set(saved.map((s) => s.jobId));
}
