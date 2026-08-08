export default function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 p-5">
      <span className="absolute inset-x-0 top-0 h-px bg-jade/40" />
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      {/* Sans, not the display serif: a KPI value is data, not editorial type. */}
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
