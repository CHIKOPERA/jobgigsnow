import "server-only";
import { courseCardSelect, toCourseCard } from "@/lib/course-dto";
import { prisma } from "@/lib/prisma";
import type { CourseListQuery } from "@/lib/validation/course";

export async function fetchCoursePage(query: CourseListQuery) {
  const rows = await prisma.course.findMany({
    where: { published: true },
    select: courseCardSelect,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor && { cursor: { slug: query.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;

  return {
    courses: page.map(toCourseCard),
    nextCursor: hasMore ? page[page.length - 1].slug : null,
  };
}
