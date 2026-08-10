"use client";

import { useState, type FormEvent } from "react";
import { getAttribution } from "@/lib/attribution";
import { buttonClasses } from "@/lib/ui";

type Source = "CONTACT_FORM" | "AUDIT_FUNNEL" | "NEWSLETTER";

interface LeadFormProps {
  source: Source;
  submitLabel: string;
  showCompany?: boolean;
  showWebsite?: boolean;
  showMessage?: boolean;
  messagePlaceholder?: string;
  className?: string;
}

type Status = "idle" | "submitting" | "success" | "error";

const INPUT_CLASSES =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 transition focus:border-jade/60 focus:outline-none focus:ring-1 focus:ring-jade/30";

export default function LeadForm({
  source,
  submitLabel,
  showCompany = false,
  showWebsite = false,
  showMessage = false,
  messagePlaceholder,
  className,
}: LeadFormProps) {
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
      website: data.get("website") || null,
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
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={className}>
        <p className="rounded-lg border border-jade/30 bg-jade/10 px-4 py-3 text-sm text-jade">
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
            className={INPUT_CLASSES}
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
            className={INPUT_CLASSES}
            placeholder="ada@example.com"
          />
        </div>
        {showCompany && (
          <div className="sm:col-span-1">
            <label htmlFor="company" className="mb-1 block text-sm text-white/70">
              Company / project
            </label>
            <input
              id="company"
              name="company"
              type="text"
              className={INPUT_CLASSES}
              placeholder="Optional"
            />
          </div>
        )}
        {showWebsite && (
          <div className="sm:col-span-1">
            <label htmlFor="website" className="mb-1 block text-sm text-white/70">
              Website
            </label>
            <input
              id="website"
              name="website"
              type="text"
              className={INPUT_CLASSES}
              placeholder="yoursite.com"
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
              className={INPUT_CLASSES}
              placeholder={messagePlaceholder}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className={buttonClasses("primary", "md", "mt-4")}
      >
        {status === "submitting" ? "Sending…" : submitLabel}
      </button>

      {status === "error" && (
        <p className="mt-3 text-sm text-red-400">Something went wrong — mind trying again?</p>
      )}
    </form>
  );
}
