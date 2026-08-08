import { formatDayLabel } from "@/lib/analytics";

interface TrendPoint {
  date: string;
  count: number;
}

/** A compact day-by-day column chart — sequential jade, sparse axis labels, native tooltips. */
export default function TrendBars({ title, data }: { title: string; data: TrendPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const labelEvery = Math.ceil(data.length / 6);

  return (
    <div className="rounded-xl border border-white/10 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wide text-white/40">{title}</p>
        <p className="text-xs text-white/40">{total} total</p>
      </div>
      <div className="mt-5 flex h-28 gap-1">
        {data.map((point) => (
          <div
            key={point.date}
            className="group relative h-full flex-1"
            title={`${formatDayLabel(point.date)}: ${point.count}`}
          >
            <div
              className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[18px] rounded-t bg-jade transition group-hover:bg-jade-bright"
              style={{ height: `${Math.max(2, (point.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 text-[10px] text-white/30">
        {data.map((point, i) => (
          <div key={point.date} className="flex-1 text-center">
            {i % labelEvery === 0 ? formatDayLabel(point.date) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
