import { auth } from "@clerk/nextjs/server";
import { featureFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { updateAlertSchema } from "@/lib/validation/saved";

export async function PATCH(request: Request, ctx: RouteContext<"/api/alerts/[id]">) {
  if (!featureFlags.alerts) {
    return errorResponse("NOT_FOUND", "Alerts are not enabled.", 404);
  }
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to manage alerts.", 401);
  }

  const { id } = await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = updateAlertSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  const existing = await prisma.jobAlert.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) {
    return errorResponse("NOT_FOUND", "Alert not found.", 404);
  }

  const alert = await prisma.jobAlert.update({ where: { id }, data: parsed.data });

  return Response.json({ alert });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/alerts/[id]">) {
  if (!featureFlags.alerts) {
    return errorResponse("NOT_FOUND", "Alerts are not enabled.", 404);
  }
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to manage alerts.", 401);
  }

  const { id } = await ctx.params;

  await prisma.jobAlert.deleteMany({ where: { id, userId } });

  return new Response(null, { status: 204 });
}
