import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";

export const metadata: Metadata = { title: "Free AI-readiness audit" };

const CHECKLIST = [
  "Is your site actually capturing every interested visitor, or just the ones who happen to fill out a form?",
  "Do you know which channel your best leads come from — or does it all land in one inbox unlabeled?",
  "If a visitor asks a question at 11pm, does anything answer them?",
  "When a lead comes in, does anything happen automatically — or does someone have to notice it?",
];

export default function AuditPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-widest text-white/40">Free audit</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        The 15-point AI-readiness audit
      </h1>
      <p className="mt-6 max-w-xl text-white/70">
        A short, honest look at where your site is leaking prospects — and exactly which piece of
        this system (site, automation, AI, or funnel) would fix it fastest. Delivered by email,
        no call required.
      </p>

      <ul className="mt-10 space-y-4">
        {CHECKLIST.map((item) => (
          <li key={item} className="flex gap-3 text-white/70">
            <span className="mt-1 text-white/30">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-lg font-semibold text-white">Get yours</h2>
        <p className="mt-2 text-sm text-white/60">
          Two fields. Submitting this creates a tracked, scored lead — exactly like everything else
          on this site.
        </p>
        <LeadForm
          source="AUDIT_FUNNEL"
          submitLabel="Send me the audit"
          showCompany
          redirectTo="/thank-you"
          className="mt-6"
        />
      </div>
    </div>
  );
}
