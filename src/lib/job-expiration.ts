/** Date-only deadlines remain open for the whole advertised day. */
export function isExpiredClosingDate(value: string | Date | null | undefined, now = new Date()): boolean {
  if (!value) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime()) && value.getTime() < now.getTime();

  const trimmed = value.trim();
  if (!trimmed) return false;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T23:59:59.999Z`).getTime() < now.getTime();
  }
  return parsed.getTime() < now.getTime();
}

/** Uses only JobPosting.validThrough, avoiding unrelated nested end-date fields. */
export function hasExpiredJsonLdDeadline(postings: Record<string, unknown>[], now = new Date()): boolean {
  const deadlines = postings
    .map((posting) => posting.validThrough)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  return deadlines.length > 0 && deadlines.every((deadline) => isExpiredClosingDate(deadline, now));
}
