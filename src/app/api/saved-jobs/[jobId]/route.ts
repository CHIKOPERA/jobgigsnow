import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/saved-jobs/[jobId]">) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to manage saved jobs.", 401);
  }

  const { jobId } = await ctx.params;

  await prisma.savedJob.deleteMany({ where: { userId, jobId } });

  return new Response(null, { status: 204 });
}
