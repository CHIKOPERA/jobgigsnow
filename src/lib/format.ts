const ACCENT_TILE_CLASSES = [
  "bg-accent-mint",
  "bg-accent-iris",
  "bg-accent-orchid",
  "bg-accent-sage",
] as const;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function accentTileClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ACCENT_TILE_CLASSES[hash % ACCENT_TILE_CLASSES.length];
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
};

export function employmentLabel(value: string): string {
  return EMPLOYMENT_LABELS[value] ?? value;
}

const REMOTE_LABELS: Record<string, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

export function remoteLabel(value: string): string {
  return REMOTE_LABELS[value] ?? value;
}

export function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
  period: string | null,
): string | null {
  if (min === null && max === null) return null;
  const symbol = currency === "USD" || !currency ? "$" : `${currency} `;
  const suffix = period === "HOURLY" ? "/hr" : period === "YEARLY" ? "/yr" : "";
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

  if (min !== null && max !== null && min !== max) {
    return `${symbol}${fmt(min)}–${fmt(max)}${suffix}`;
  }
  const single = min ?? max;
  return single === null ? null : `${symbol}${fmt(single)}${suffix}`;
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Not yet posted";
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  const months = Math.floor(days / 30);
  return `Posted ${months} month${months > 1 ? "s" : ""} ago`;
}

export function formatClosedTime(iso: string | null): string {
  if (!iso) return "Closed";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Closed today";
  if (days === 1) return "Closed yesterday";
  return `Closed ${days} days ago`;
}

/** Null when there's no deadline, or the deadline has already passed — callers should only show
 *  this chip on still-open jobs, and a passed closesAt on an open job means "no real deadline." */
export function daysLeftLabel(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return null;
  if (days === 1) return "1 day left";
  if (days <= 30) return `${days} days left`;
  return null;
}
