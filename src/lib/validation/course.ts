import { z } from "zod";
import { pagination } from "@/config/pagination";

export const courseListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(pagination.jobsMaxPageSize).default(pagination.jobsPageSize),
});
export type CourseListQuery = z.infer<typeof courseListQuerySchema>;

export const courseCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  provider: z.string(),
  priceLabel: z.string().nullable(),
  durationLabel: z.string().nullable(),
  publishedAt: z.iso.datetime().nullable(),
});
export type CourseCardDto = z.infer<typeof courseCardSchema>;

export const courseListResponseSchema = z.object({
  courses: z.array(courseCardSchema),
  nextCursor: z.string().nullable(),
});
export type CourseListResponse = z.infer<typeof courseListResponseSchema>;

export const courseDetailSchema = courseCardSchema.extend({
  description: z.string(),
  enrollUrl: z.string(),
});
export type CourseDetailDto = z.infer<typeof courseDetailSchema>;
