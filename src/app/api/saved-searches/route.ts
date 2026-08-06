import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { createSavedSearchSchema } from "@/lib/validation/saved";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to view saved searches.", 401);
  }

  const searches = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ savedSearches: searches });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Sign in to save a search.", 401);
  }

  const json = await request.json().catch(() => null);
  const parsed = createSavedSearchSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("INVALID_BODY", parsed.error.issues[0]?.message ?? "Invalid body.", 400);
  }

  const savedSearch = await prisma.savedSearch.create({
    data: { userId, name: parsed.data.name, query: parsed.data.query },
  });

  return Response.json({ savedSearch }, { status: 201 });
}
