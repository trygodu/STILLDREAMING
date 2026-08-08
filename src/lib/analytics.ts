const DAY_MS = 24 * 60 * 60 * 1000;

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

/** Buckets timestamped rows into UTC-day counts, zero-filled across the full range. */
export function bucketByDay(rows: { createdAt: Date }[], days: number): { date: string; count: number }[] {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export function countBy<T, K extends string>(rows: T[], keyOf: (row: T) => K | null | undefined): { label: K; count: number }[] {
  const counts = new Map<K, number>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function formatDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
