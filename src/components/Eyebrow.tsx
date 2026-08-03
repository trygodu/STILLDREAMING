export default function Eyebrow({
  index,
  children,
  className = "",
}: {
  index?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-jade ${className}`}>
      {index && <span className="font-display text-[13px] italic tracking-normal text-white/30">{index}</span>}
      {children}
    </p>
  );
}
