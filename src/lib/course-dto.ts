import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { CourseCardDto, CourseDetailDto } from "./validation/course";

export const courseCardSelect = {
  slug: true,
  title: true,
  provider: true,
  priceLabel: true,
  durationLabel: true,
  publishedAt: true,
} satisfies Prisma.CourseSelect;

export type CourseCardRow = Prisma.CourseGetPayload<{ select: typeof courseCardSelect }>;

export const courseDetailSelect = {
  ...courseCardSelect,
  description: true,
  enrollUrl: true,
} satisfies Prisma.CourseSelect;

export type CourseDetailRow = Prisma.CourseGetPayload<{ select: typeof courseDetailSelect }>;

export function toCourseCard(row: CourseCardRow): CourseCardDto {
  return {
    slug: row.slug,
    title: row.title,
    provider: row.provider,
    priceLabel: row.priceLabel,
    durationLabel: row.durationLabel,
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

export function toCourseDetail(row: CourseDetailRow): CourseDetailDto {
  return {
    ...toCourseCard(row),
    description: row.description,
    enrollUrl: row.enrollUrl,
  };
}
