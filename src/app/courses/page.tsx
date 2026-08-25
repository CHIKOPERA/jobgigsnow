import type { Metadata } from "next";
import { site } from "@/config";
import { CourseCard } from "@/components/content/CourseCard";
import { fetchCoursePage } from "@/lib/course-query";
import { prisma } from "@/lib/prisma";
import { courseListQuerySchema } from "@/lib/validation/course";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const publishedCount = await prisma.course.count({ where: { published: true } });
  return {
    title: "Online courses",
    description: "Explore selected online courses that can help you build practical, job-relevant skills.",
    alternates: { canonical: `${site.url.replace(/\/$/, "")}/courses` },
    robots: { index: publishedCount > 0, follow: true },
  };
}

export default async function CoursesPage() {
  const { courses } = await fetchCoursePage(courseListQuerySchema.parse({}));

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
      <h1 className="text-title font-semibold" style={{ fontSize: "22px" }}>
        Online courses
      </h1>
      <p aria-live="polite" className="mt-2 text-meta text-ink-muted">
        {courses.length} course{courses.length === 1 ? "" : "s"}
      </p>
      {courses.length === 0 ? (
        <div className="mt-4 rounded-md border border-line bg-surface p-6 text-center text-body text-ink-muted">
          No courses listed yet — check back soon.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {courses.map((course) => (
            <li key={course.slug}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
