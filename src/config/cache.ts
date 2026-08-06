import "server-only";

export const cache = {
  jobsListRevalidateSeconds: 60,
  jobDetailRevalidateSeconds: 300,
  companyRevalidateSeconds: 3600,
  filtersRevalidateSeconds: 300,
} as const;
