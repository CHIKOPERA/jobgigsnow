import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { courseDetailSelect, toCourseDetail } from "@/lib/course-dto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

async function getCourse(slug: string) {
  const row = await prisma.course.findFirst({
    where: { slug, published: true },
    select: courseDetailSelect,
  });
  return row ? toCourseDetail(row) : null;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  return { title: course ? `${course.title} — ${course.provider}` : "Course not found" };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <article className="rounded-md border border-line bg-surface p-6">
        <h1 className="text-title font-semibold tracking-[-0.015em]" style={{ fontSize: "22px" }}>
          {course.title}
        </h1>
        <p className="mt-1 text-body text-ink-muted">{course.provider}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {course.priceLabel && (
            <span className="rounded-pill bg-bg px-2.5 py-[5px] text-[12px] text-[#2b2d24]">
              {course.priceLabel}
            </span>
          )}
          {course.durationLabel && (
            <span className="rounded-pill bg-bg px-2.5 py-[5px] text-[12px] text-[#2b2d24]">
              {course.durationLabel}
            </span>
          )}
        </div>

        <div className="mt-6 whitespace-pre-line text-body leading-relaxed">{course.description}</div>

        <div className="mt-8">
          <LinkButton href={course.enrollUrl} target="_blank" rel="noopener noreferrer">
            Enroll
          </LinkButton>
        </div>
      </article>
    </div>
  );
}
