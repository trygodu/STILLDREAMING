import Link from "next/link";

const PILLARS = [
  {
    title: "The website",
    body: "Fast, modern, App Router Next.js — the same page you're reading now, written and shipped with Claude.",
  },
  {
    title: "The lead system",
    body: "Every form, funnel, and chat conversation is captured, scored, and logged automatically. Nothing goes to a spreadsheet by hand.",
  },
  {
    title: "The AI chatbot",
    body: "Bottom-right corner. It answers questions about this work and quietly captures interested visitors as leads while it does.",
  },
  {
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
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-28">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-white/40">
          Still Dreaming — built by Claude
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          This site is the proof.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70">
          Not a portfolio of screenshots — a working system. The page you&rsquo;re on, the chatbot in
          the corner, and the lead it might just capture from you are all one build: a website, an
          automated prospect-tracking system, AI features, and the funnels that tie them together.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/audit"
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Get the free AI-readiness audit
          </Link>
          <Link
            href="/work"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            See how it&rsquo;s built
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-none bg-white/10 px-0 py-0 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="bg-black/40 p-8">
              <h3 className="mb-2 text-base font-semibold text-white">{pillar.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          What happens the moment you showed up
        </h2>
        <p className="mt-3 max-w-2xl text-white/60">
          Every visit to this site runs through the same automated pipeline. It&rsquo;s already run
          once — for you.
        </p>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.label} className="rounded-xl border border-white/10 p-6">
              <span className="text-xs font-medium text-white/40">Step {i + 1}</span>
              <p className="mt-2 font-medium text-white">{step.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-20 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Want the same system for what you&rsquo;re building?
            </h2>
            <p className="mt-3 max-w-xl text-white/60">
              Sites, automated funnels, and AI integrations — scoped and shipped the same way this
              one was.
            </p>
          </div>
          <Link
            href="/services"
            className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            See services
          </Link>
        </div>
      </section>
    </div>
  );
}
