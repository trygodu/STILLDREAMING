import Link from "next/link";
import Marquee from "@/components/Marquee";
import Eyebrow from "@/components/Eyebrow";
import { buttonClasses } from "@/lib/ui";

const PILLARS = [
  {
    index: "01",
    title: "The website",
    body: "Fast, modern, App Router Next.js — the same page you're reading now, written and shipped with Claude.",
  },
  {
    index: "02",
    title: "The lead system",
    body: "Every form, funnel, and chat conversation is captured, scored, and logged automatically. Nothing goes to a spreadsheet by hand.",
  },
  {
    index: "03",
    title: "The AI chatbot",
    body: "Bottom-right corner. It answers questions about this work and quietly captures interested visitors as leads while it does.",
  },
  {
    index: "04",
    title: "The funnels",
    body: "The audit page, the chatbot hand-off, the contact form — three different paths engineered to turn a visit into a tracked prospect.",
  },
];

const STEPS = [
  { label: "Visitor arrives", detail: "From search, a link, or an ad — attribution (UTM, referrer) is captured immediately." },
  { label: "They engage", detail: "Via the chatbot, the contact form, or the free-audit funnel." },
  { label: "Lead is scored & logged", detail: "Automatically, with a score based on intent signals — no manual entry." },
  { label: "Follow-up fires", detail: "A notification goes out the moment a lead lands, ready to plug into email or CRM." },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <Eyebrow>Still Dreaming — built by Claude</Eyebrow>
        <h1 className="max-w-3xl font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          This site is the <span className="italic text-jade">proof.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-lg text-white/70">
          Not a portfolio of screenshots — a working system. The page you&rsquo;re on, the chatbot in
          the corner, and the lead it might just capture from you are all one build: a website, an
          automated prospect-tracking system, AI features, and the funnels that tie them together.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/audit" className={buttonClasses("primary")}>
            Get the free AI-readiness audit
          </Link>
          <Link href="/work" className={buttonClasses("outline")}>
            See how it&rsquo;s built
          </Link>
        </div>
      </section>

      <Marquee />

      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="group relative bg-background p-8 transition hover:bg-jade/[0.04]"
            >
              <span className="absolute inset-x-0 top-0 h-px scale-x-0 bg-jade transition-transform duration-300 group-hover:scale-x-100" />
              <span className="font-display text-sm italic text-jade/70">{pillar.index}</span>
              <h3 className="mt-3 mb-2 text-base font-semibold text-white">{pillar.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <Eyebrow index="→">Pipeline</Eyebrow>
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          What happens the moment you showed up
        </h2>
        <p className="mt-3 max-w-2xl text-white/60">
          Every visit to this site runs through the same automated pipeline. It&rsquo;s already run
          once — for you.
        </p>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.label} className="bg-background p-6">
              <span className="font-display text-3xl italic text-jade/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 font-medium text-white">{step.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl px-6 py-20 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              Want the same system for what you&rsquo;re building?
            </h2>
            <p className="mt-3 max-w-xl text-white/60">
              Sites, automated funnels, and AI integrations — scoped and shipped the same way this
              one was.
            </p>
          </div>
          <Link href="/services" className={`shrink-0 ${buttonClasses("primary")}`}>
            See services
          </Link>
        </div>
      </section>
    </div>
  );
}
