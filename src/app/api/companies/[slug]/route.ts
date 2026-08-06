import { cache } from "@/config/cache";
import { jobCardSelect, toJobCard } from "@/lib/dto";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/validation/common";
import { companyDetailSchema } from "@/lib/validation/company";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: RouteContext<"/api/companies/[slug]">) {
  const { slug } = await ctx.params;

  const company = await prisma.company.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      domain: true,
      logoUrl: true,
      jobs: {
        where: { status: "PUBLISHED" },
        select: jobCardSelect,
        orderBy: [{ postedAt: "desc" }, { id: "desc" }],
      },
    },
  });

  if (!company) {
    return errorResponse("NOT_FOUND", "Company not found.", 404);
  }

  const body = companyDetailSchema.parse({
    name: company.name,
    slug: company.slug,
    domain: company.domain,
    logoUrl: company.logoUrl,
    jobs: company.jobs.map(toJobCard),
  });

  return Response.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${cache.companyRevalidateSeconds}, stale-while-revalidate=120`,
    },
  });
}
