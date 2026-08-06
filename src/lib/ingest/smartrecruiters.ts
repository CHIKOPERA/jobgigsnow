export interface SmartRecruitersPosting {
  id: string;
  postingUrl: string;
}

export interface SmartRecruitersPage {
  postings: SmartRecruitersPosting[];
  totalFound: number;
}

export function buildSmartRecruitersPageUrl(companyIdentifier: string, limit: number, offset: number): string {
  const url = new URL(
    `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companyIdentifier)}/postings`,
  );
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  return url.toString();
}

/** Validates only the fields discovery owns; the detail-page pipeline handles job content. */
export function parseSmartRecruitersPage(payload: unknown): SmartRecruitersPage {
  if (!payload || typeof payload !== "object") {
    throw new Error("SmartRecruiters returned an invalid response.");
  }

  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.content)) {
    throw new Error("SmartRecruiters response is missing content.");
  }

  const postings: SmartRecruitersPosting[] = [];
  for (const value of record.content) {
    if (!value || typeof value !== "object") continue;
    const posting = value as Record<string, unknown>;
    if (typeof posting.id !== "string" || typeof posting.postingUrl !== "string") continue;

    try {
      const url = new URL(posting.postingUrl);
      if (url.protocol === "https:" || url.protocol === "http:") {
        postings.push({ id: posting.id, postingUrl: url.toString() });
      }
    } catch {
      // Ignore malformed entries without discarding the rest of the API page.
    }
  }

  const totalFound = typeof record.totalFound === "number" && record.totalFound >= 0
    ? record.totalFound
    : postings.length;

  return { postings, totalFound };
}
