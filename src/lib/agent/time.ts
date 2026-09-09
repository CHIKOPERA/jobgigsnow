const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** Africa/Johannesburg stays on UTC+2 year-round, while Vercel functions run on UTC. */
export function johannesburgDateKey(date = new Date()): string {
  return new Date(date.getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}

export function johannesburgDayBounds(date = new Date()): { start: Date; end: Date } {
  const key = johannesburgDateKey(date);
  const start = new Date(`${key}T00:00:00.000+02:00`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export function isoDateDaysAgo(days: number, date = new Date()): string {
  return johannesburgDateKey(new Date(date.getTime() - days * 24 * 60 * 60 * 1000));
}
