const ITEMS = ["Websites", "Automated lead systems", "AI chatbots", "Funnels", "Brand & copy", "Dashboards"];

export default function Marquee() {
  const content = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden border-y border-white/10 bg-black/30 py-4">
      <div className="motion-safe:animate-marquee flex w-max gap-12 whitespace-nowrap">
        {content.map((item, i) => (
          <span key={i} className="flex items-center gap-12 text-sm uppercase tracking-[0.2em] text-white/45">
            {item}
            <span className="text-jade">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
