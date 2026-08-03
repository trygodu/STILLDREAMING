import type { Metadata } from "next";
import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";
import { buttonClasses } from "@/lib/ui";

export const metadata: Metadata = { title: "Services" };

const SERVICES = [
  {
    index: "01",
    name: "Website",
    description:
      "A fast, modern site built for the goal it actually serves — conversion, credibility, or both. Same stack as this one: Next.js, deployed and maintainable.",
    items: ["Design & copy", "App Router / Next.js build", "Analytics & attribution baked in"],
  },
  {
    index: "02",
    name: "Automated prospect system",
    description:
      "Every visitor, form fill, and conversation tracked, scored, and stored — with a dashboard to manage the pipeline instead of a spreadsheet.",
    items: ["Lead capture across every entry point", "Automatic scoring", "Notification & handoff automation"],
  },
  {
    index: "03",
    name: "AI features",
    description:
      "A chatbot or assistant that does more than answer FAQs — one that understands your offer, qualifies visitors, and captures leads while it talks.",
    items: ["Claude-powered chat", "Graceful demo/fallback mode", "Lead hand-off built in"],
  },
  {
    index: "04",
    name: "Funnels",
    description:
      "Purpose-built paths — lead magnets, audits, booking flows — engineered to turn traffic into tracked, attributed prospects.",
    items: ["Lead-magnet pages", "Thank-you / nurture flow", "UTM & campaign attribution"],
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <Eyebrow index="03">Services</Eyebrow>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Services</h1>
      <p className="mt-6 max-w-2xl text-white/70">
        These aren&rsquo;t four separate products — they&rsquo;re one system, and this site runs all
        four at once. Pick a starting point; the rest tends to follow.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {SERVICES.map((service) => (
          <div
            key={service.name}
            className="group relative overflow-hidden rounded-2xl border border-white/10 p-8 transition hover:border-jade/30"
          >
            <span className="absolute -right-4 -top-6 font-display text-8xl italic text-white/[0.03] transition group-hover:text-jade/[0.06]">
              {service.index}
            </span>
            <h2 className="relative font-display text-xl text-white">{service.name}</h2>
            <p className="relative mt-3 text-sm text-white/60">{service.description}</p>
            <ul className="relative mt-5 space-y-2">
              {service.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-jade" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-start gap-4 rounded-2xl border border-jade/20 bg-jade/[0.04] p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg text-white">Not sure where to start?</h2>
          <p className="mt-2 text-sm text-white/60">
            The free audit takes two minutes and tells you exactly that.
          </p>
        </div>
        <Link href="/audit" className={`shrink-0 ${buttonClasses("primary")}`}>
          Get the free audit
        </Link>
      </div>
    </div>
  );
}
