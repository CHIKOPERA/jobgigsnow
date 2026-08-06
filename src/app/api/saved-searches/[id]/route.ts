import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/saved-searches/[id]">) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to manage saved searches.", 401);
  }

  const { id } = await ctx.params;

  await prisma.savedSearch.deleteMany({ where: { id, userId } });

  return new Response(null, { status: 204 });
}
