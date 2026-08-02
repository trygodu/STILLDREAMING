import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Get in touch</h1>
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
        className="mt-10"
      />
    </div>
  );
}
