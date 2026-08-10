interface BarListItem {
  label: string;
  count: number;
}

/** Sequential, single-hue (jade) magnitude comparison — no legend needed, the label carries identity. */
export default function BarList({
  title,
  items,
  emptyLabel = "No data yet.",
}: {
  title: string;
  items: BarListItem[];
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div className="rounded-xl border border-white/10 p-5">
      <p className="text-xs uppercase tracking-wide text-white/40">{title}</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((item) => (
            <li key={item.label} title={`${item.label}: ${item.count}`}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate text-white/70">{item.label}</span>
                <span className="shrink-0 font-medium text-white">{item.count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-jade"
                  style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
