import Link from "next/link";

export default function CourseNotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 className="text-title font-semibold">Course not found</h1>
      <p className="mt-2 text-body text-ink-muted">This course may have been moved or removed.</p>
      <Link
        href="/courses"
        className="focus-ring mt-6 inline-flex h-12 items-center rounded-pill bg-ink px-6 text-body font-medium text-[#F6F7F0]"
      >
        Back to courses
      </Link>
    </div>
  );
}
