import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The approach</h1>
      <div className="mt-8 space-y-6 text-white/70">
        <p>
          Most agency pitches show you screenshots of past work and ask you to trust that the same
          quality applies to yours. This site skips that step: everything it claims to be able to
          build — the site itself, the lead pipeline, the AI chatbot, the funnels — is running right
          now, on the page you&rsquo;re reading.
        </p>
        <p>
          That&rsquo;s the whole philosophy. Rather than describe a system, ship one small enough to
          verify end to end: a Next.js site, a database tracking every visitor and lead, an AI
          concierge that can hold a real conversation and knows when to ask for contact info, and
          funnels engineered to turn attention into a tracked prospect — all wired together, all
          inspectable.
        </p>
        <p>
          The build partner is Claude. Not as a buzzword — as the actual author of the code running
          this page, the API routes behind the chatbot, and the automation that scored and logged
          the lead the moment you filled out a form (or just showed up).
        </p>
        <p>
          If that&rsquo;s the kind of system you want behind your own site — one that does more than
          look good — that&rsquo;s exactly what&rsquo;s on offer.
        </p>
      </div>
    </div>
  );
}
