import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/lib/ui";

export const metadata: Metadata = { title: "You're in" };

export default function ThankYouPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-jade">Step complete</p>
      <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
        You&rsquo;re in the <span className="italic text-jade">system.</span>
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
        <Link href="/work" className={buttonClasses("primary")}>
          See how it&rsquo;s built
        </Link>
        <Link href="/" className={buttonClasses("outline")}>
          Back home
        </Link>
      </div>
    </div>
  );
}
