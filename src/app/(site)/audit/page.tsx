import type { Metadata } from "next";
import Link from "next/link";
import AuditSignupForm from "@/components/AuditSignupForm";
import Eyebrow from "@/components/Eyebrow";

export const metadata: Metadata = { title: "Free AI-readiness audit" };

const CHECKLIST = [
  "Is your site actually capturing every interested visitor, or just the ones who happen to fill out a form?",
  "Do you know which channel your best leads come from — or does it all land in one inbox unlabeled?",
  "Is anything tracking your marketing — analytics, a pixel — or are you flying blind?",
  "Is your business's public info (social links, local listing) actually working for you?",
];

export default function AuditPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Eyebrow>Free audit</Eyebrow>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
        The 15-point AI-readiness audit
      </h1>
      <p className="mt-6 max-w-xl text-white/70">
        A real scan of your site — SEO, marketing tech, mobile-friendliness, social presence — turned
        into a live dashboard and a proposal, both waiting the moment you submit. Not a PDF in your
        inbox later; a login you can come back to.
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
          This creates your login to a personal portal — your dashboard, your proposal, come back
          anytime. Already have one?{" "}
          <Link href="/portal" className="text-jade underline underline-offset-4 hover:text-jade-bright">
            Sign in
          </Link>
          .
        </p>
        <AuditSignupForm className="mt-6" />
      </div>
    </div>
  );
}
