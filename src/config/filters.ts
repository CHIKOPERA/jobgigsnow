// No secrets here — safe to import from Client Components (e.g. FilterSheet).
export const filters = {
  remoteTypes: ["ONSITE", "HYBRID", "REMOTE"] as const,
  employmentTypes: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"] as const,
  postedWithinOptions: [
    { label: "Past 24 hours", days: 1 },
    { label: "Past week", days: 7 },
    { label: "Past month", days: 30 },
  ] as const,
  maxTagsPerFilter: 8,
  newThresholdHours: 48,
} as const;
