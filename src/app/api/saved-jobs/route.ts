import { auth } from "@clerk/nextjs/server";
import { pagination } from "@/config/pagination";
import { jobCardSelect, toJobCard } from "@/lib/dto";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { saveJobBodySchema } from "@/lib/validation/saved";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to view saved jobs.", 401);
  }

  const saved = await prisma.savedJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: pagination.savedJobsPageSize,
    select: { jobId: true, createdAt: true, job: { select: jobCardSelect } },
  });

  return Response.json({
    jobs: saved.map((s) => ({ ...toJobCard(s.job), savedAt: s.createdAt.toISOString() })),
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to save jobs.", 401);
  }

  const json = await request.json().catch(() => null);
  const parsed = saveJobBodySchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  const job = await prisma.job.findUnique({ where: { id: parsed.data.jobId }, select: { id: true } });
  if (!job) {
    return errorResponse("NOT_FOUND", "Job not found.", 404);
  }

  await prisma.savedJob.upsert({
    where: { userId_jobId: { userId, jobId: job.id } },
    update: {},
    create: { userId, jobId: job.id },
  });

  return Response.json({ saved: true }, { status: 201 });
}
