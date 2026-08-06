import "server-only";
import { filters as filtersConfig } from "@/config/filters";
import { jobCardSelect, toJobCard } from "@/lib/dto";
import { buildJobWhere } from "@/lib/job-filters";
import { prisma } from "@/lib/prisma";
import type { FilterFacetsDto } from "@/lib/validation/filters";
import type { JobListQuery } from "@/lib/validation/job";

export { buildJobWhere };

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function fetchJobPage(query: JobListQuery) {
  const where = buildJobWhere(query);

  const rows = await prisma.job.findMany({
    where,
    select: jobCardSelect,
    orderBy: [{ postedAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;

  return {
    jobs: page.map(toJobCard),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function getFilterFacets(): Promise<FilterFacetsDto> {
  const [locationGroups, remoteGroups, employmentGroups, tagGroups] = await Promise.all([
    prisma.job.groupBy({
      by: ["location"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
      orderBy: { _count: { location: "desc" } },
      take: 20,
    }),
    prisma.job.groupBy({
      by: ["remoteType"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
    }),
    prisma.job.groupBy({
      by: ["employmentType"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
    }),
    prisma.jobTag.groupBy({
      by: ["tagId"],
      where: { job: { status: "PUBLISHED" } },
      _count: { _all: true },
      orderBy: { _count: { tagId: "desc" } },
      take: filtersConfig.maxTagsPerFilter,
    }),
  ]);

  const tagIds = tagGroups.map((t) => t.tagId);
  const tagRows = tagIds.length
    ? await prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true, name: true } })
    : [];
  const tagNameById = new Map(tagRows.map((t) => [t.id, t.name]));

  return {
    locations: locationGroups.map((g) => ({
      value: g.location,
      label: g.location,
      count: g._count._all,
    })),
    remoteTypes: remoteGroups.map((g) => ({
      value: g.remoteType,
      label: titleCase(g.remoteType),
      count: g._count._all,
    })),
    employmentTypes: employmentGroups.map((g) => ({
      value: g.employmentType,
      label: titleCase(g.employmentType),
      count: g._count._all,
    })),
    tags: tagGroups
      .map((g) => ({
        value: tagNameById.get(g.tagId) ?? g.tagId,
        label: tagNameById.get(g.tagId) ?? g.tagId,
        count: g._count._all,
      }))
      .filter((t) => t.value),
  };
}
