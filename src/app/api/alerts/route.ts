import { auth } from "@clerk/nextjs/server";
import { featureFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { createAlertSchema } from "@/lib/validation/saved";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!featureFlags.alerts) {
    return errorResponse("NOT_FOUND", "Alerts are not enabled.", 404);
  }
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to view alerts.", 401);
  }

  const alerts = await prisma.jobAlert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ alerts });
}

export async function POST(request: Request) {
  if (!featureFlags.alerts) {
    return errorResponse("NOT_FOUND", "Alerts are not enabled.", 404);
  }
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to create an alert.", 401);
  }

  const json = await request.json().catch(() => null);
  const parsed = createAlertSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  const alert = await prisma.jobAlert.create({
    data: { userId, ...parsed.data },
  });

  return Response.json({ alert }, { status: 201 });
}
