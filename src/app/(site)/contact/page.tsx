import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import Eyebrow from "@/components/Eyebrow";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <Eyebrow index="04">Contact</Eyebrow>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Get in touch</h1>
      <p className="mt-6 text-white/70">
        Tell me what you&rsquo;re trying to build. This form is itself part of the system — your
        message is scored, logged, and flagged for follow-up the moment you hit send.
      </p>

      <LeadForm
        source="CONTACT_FORM"
        submitLabel="Send message"
        showCompany
        showMessage
        messagePlaceholder="A site that converts, a system to track leads, an AI feature, or all of the above…"
        className="mt-10 rounded-2xl border border-white/10 p-8"
      />
    </div>
  );
}
