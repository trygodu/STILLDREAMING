"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAttribution } from "@/lib/attribution";

type Source = "CONTACT_FORM" | "AUDIT_FUNNEL" | "NEWSLETTER";

interface LeadFormProps {
  source: Source;
  submitLabel: string;
  showCompany?: boolean;
  showMessage?: boolean;
  messagePlaceholder?: string;
  redirectTo?: string;
  className?: string;
}

type Status = "idle" | "submitting" | "success" | "error";

export default function LeadForm({
  source,
  submitLabel,
  showCompany = false,
  showMessage = false,
  messagePlaceholder,
  redirectTo,
  className,
}: LeadFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      ...getAttribution(),
      source,
      name: data.get("name") || null,
      email: data.get("email"),
      company: data.get("company") || null,
      message: data.get("message") || null,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("request failed");

      setStatus("success");
      form.reset();
      if (redirectTo) router.push(redirectTo);
    } catch {
      setStatus("error");
    }
  }

  if (status === "success" && !redirectTo) {
    return (
      <div className={className}>
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          Got it — you&rsquo;re in the system. I&rsquo;ll follow up shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="name" className="mb-1 block text-sm text-white/70">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            placeholder="Ada Lovelace"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="email" className="mb-1 block text-sm text-white/70">
            Email <span className="text-white/40">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            placeholder="ada@example.com"
          />
        </div>
        {showCompany && (
          <div className="sm:col-span-2">
            <label htmlFor="company" className="mb-1 block text-sm text-white/70">
              Company / project
            </label>
            <input
              id="company"
              name="company"
              type="text"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
              placeholder="Optional"
            />
          </div>
        )}
        {showMessage && (
          <div className="sm:col-span-2">
            <label htmlFor="message" className="mb-1 block text-sm text-white/70">
              What are you trying to build?
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
              placeholder={messagePlaceholder}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
      >
        {status === "submitting" ? "Sending…" : submitLabel}
      </button>

      {status === "error" && (
        <p className="mt-3 text-sm text-red-400">Something went wrong — mind trying again?</p>
      )}
    </form>
  );
}
