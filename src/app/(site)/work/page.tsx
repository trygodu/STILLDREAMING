import type { Metadata } from "next";
import Link from "next/link";
import Eyebrow from "@/components/Eyebrow";

export const metadata: Metadata = { title: "Proof" };

const SYSTEM_PIECES = [
  {
    index: "01",
    title: "Attribution, from the first click",
    body: "UTM parameters, referrer, and landing page are captured client-side and attached to every page view, lead, and chat session — so every conversion can be traced back to what actually drove it.",
  },
  {
    index: "02",
    title: "Lead scoring, not just lead storage",
    body: "Every submission runs through a scoring function: company name, message depth, which funnel it came from, campaign attribution. Leads land in the dashboard already triaged.",
  },
  {
    index: "03",
    title: "A chatbot that knows when to hand off",
    body: "The concierge widget runs on Claude. It answers questions about the work, and when a visitor volunteers an email mid-conversation, that conversation becomes a scored lead automatically — no extra step.",
  },
  {
    index: "04",
    title: "Notifications that degrade gracefully",
    body: "New leads trigger an email notification. Without a mail provider configured, the pipeline still runs — it logs the notification and records it as queued, so the automation is visibly wired up even before every credential exists.",
  },
];

export default function WorkPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <Eyebrow index="02">Proof</Eyebrow>
      <h1 className="max-w-2xl font-display text-4xl tracking-tight sm:text-5xl">
        The proof is the system, not a screenshot
      </h1>
      <p className="mt-6 max-w-2xl text-white/70">
        There&rsquo;s no gallery of past client logos here — this is a from-scratch build, and the
        most honest case study available is the thing you&rsquo;re using right now. Here&rsquo;s
        what&rsquo;s actually running under this page.
      </p>

      <div className="mt-14 space-y-10">
        {SYSTEM_PIECES.map((piece) => (
          <div key={piece.title} className="flex gap-6 border-t border-white/10 pt-8">
            <span className="font-display text-2xl italic text-jade/50">{piece.index}</span>
            <div>
              <h2 className="text-lg font-semibold text-white">{piece.title}</h2>
              <p className="mt-3 max-w-2xl text-white/60">{piece.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-jade/20 bg-jade/[0.04] p-8">
        <h2 className="font-display text-lg text-white">Try it yourself</h2>
        <p className="mt-3 max-w-xl text-white/60">
          Open the chatbot in the corner and ask it something, or go through the{" "}
          <Link href="/audit" className="text-jade underline underline-offset-4 hover:text-jade-bright">
            free audit funnel
          </Link>
          . Either path creates a real, scored lead in the system behind this site.
        </p>
      </div>
    </div>
  );
}
