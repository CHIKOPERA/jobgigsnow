import Link from "next/link";
import type { CourseCardDto } from "@/lib/validation/course";

export function CourseCard({ course }: { course: CourseCardDto }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="focus-ring block rounded-md border border-line bg-surface p-4 hover:border-line-strong"
    >
      <div className="text-title font-semibold tracking-[-0.01em]" style={{ fontSize: "17px" }}>
        {course.title}
      </div>
      <div className="mt-0.5 text-meta text-ink-muted">{course.provider}</div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
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
    </Link>
  );
}
