/**
 * Every job produced or materially updated by automated aggregation must pass through the
 * editorial queue. Only the admin review endpoint is allowed to promote it to PUBLISHED.
 */
export const aggregatedJobStatus = "READY" as const;

/** Publishing is an editorial action and requires a stored social preview image first. */
export function hasRequiredSocialImage(socialImageUrl: string | null | undefined): boolean {
  return typeof socialImageUrl === "string" && socialImageUrl.trim().length > 0;
}
