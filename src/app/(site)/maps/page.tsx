import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { PORTAL_COOKIE, verifySessionToken } from "@/lib/auth";
import MapsSignupForm from "@/components/MapsSignupForm";
import Eyebrow from "@/components/Eyebrow";

export const metadata: Metadata = { title: "Free Google Maps audit" };
export const dynamic = "force-dynamic";

const CHECKLIST = [
  "Does your business even have a findable Google Maps listing — and what does it actually say?",
  "What's your real rating and review count doing for (or against) you?",
  "Is your listing complete — hours, categories, photos, a linked website?",
  "What's the fastest way to actually improve it, not just \"get more reviews\"?",
];

export default async function MapsPage() {
  const cookieStore = await cookies();
  const alreadyLoggedIn = Boolean(verifySessionToken(cookieStore.get(PORTAL_COOKIE)?.value));

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Eyebrow>Free Google Maps audit</Eyebrow>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
        What Google Maps actually says about you
      </h1>
      <p className="mt-6 max-w-xl text-white/70">
        A real lookup of your Google Business listing — rating, reviews, categories, completeness —
        turned into a dashboard and a local-marketing proposal, live the moment you submit.
      </p>

      <ul className="mt-10 space-y-4">
        {CHECKLIST.map((item) => (
          <li key={item} className="flex gap-3 text-white/70">
            <span className="mt-1 text-jade">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-2xl border border-jade/20 bg-jade/[0.04] p-8">
        <h2 className="font-display text-lg text-white">Get yours</h2>
        <p className="mt-2 text-sm text-white/60">
          {alreadyLoggedIn ? (
            "You're signed in — just tell us the business to look up, and this joins the rest of your dashboard."
          ) : (
            <>
              This creates your login to a personal portal — same one as the site audit. Already have
              one?{" "}
              <Link href="/portal" className="text-jade underline underline-offset-4 hover:text-jade-bright">
                Sign in
              </Link>
              .
            </>
          )}
        </p>
        <MapsSignupForm alreadyLoggedIn={alreadyLoggedIn} className="mt-6" />
      </div>
    </div>
  );
}
