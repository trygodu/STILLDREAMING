import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "You're in" };

export default function ThankYouPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-white/40">Step complete</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        You&rsquo;re in the system.
      </h1>
      <p className="mt-6 text-white/70">
        That submission just ran through the same pipeline every lead on this site does: captured,
        scored, and logged, with a notification already queued. A human (not a bot) will follow up
        by email shortly.
      </p>
      <p className="mt-4 text-white/70">
        In the meantime, the chatbot in the corner can answer questions right now — or take a look
        at how the whole thing is put together.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/work"
          className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
        >
          See how it&rsquo;s built
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
