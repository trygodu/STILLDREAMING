"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAttribution } from "@/lib/attribution";
import { buttonClasses } from "@/lib/ui";

type Status = "idle" | "submitting" | "error";

const INPUT_CLASSES =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 transition focus:border-jade/60 focus:outline-none focus:ring-1 focus:ring-jade/30";

export default function AuditSignupForm({ className }: { className?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [website, setWebsite] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      ...getAttribution(),
      name: data.get("name") || null,
      email: data.get("email"),
      password: data.get("password"),
      company: data.get("company") || null,
      website: data.get("website"),
    };

    try {
      const res = await fetch("/api/portal/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(result.error || "Something went wrong — mind trying again?");
        setStatus("error");
        return;
      }

      router.push("/portal");
    } catch {
      setError("Something went wrong — mind trying again?");
      setStatus("error");
    }
  }

  if (status === "submitting") {
    return (
      <div className={className}>
        <div className="flex items-center gap-3 rounded-lg border border-jade/30 bg-jade/10 px-4 py-3 text-sm text-jade">
          <span className="h-2 w-2 animate-pulse rounded-full bg-jade" />
          Scanning {website || "your site"}… drafting your dashboard and proposal now.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-white/70">
            Name
          </label>
          <input id="name" name="name" type="text" autoComplete="name" className={INPUT_CLASSES} placeholder="Ada Lovelace" />
        </div>
        <div>
          <label htmlFor="company" className="mb-1 block text-sm text-white/70">
            Company
          </label>
          <input id="company" name="company" type="text" className={INPUT_CLASSES} placeholder="Optional" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-white/70">
            Email <span className="text-white/40">*</span>
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={INPUT_CLASSES} placeholder="ada@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-white/70">
            Password <span className="text-white/40">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={INPUT_CLASSES}
            placeholder="At least 8 characters"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="website" className="mb-1 block text-sm text-white/70">
            Website <span className="text-white/40">*</span>
          </label>
          <input
            id="website"
            name="website"
            type="text"
            required
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className={INPUT_CLASSES}
            placeholder="yoursite.com"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-white/40">
        This creates your login — come back anytime at{" "}
        <span className="text-white/60">/portal</span> to see your dashboard.
      </p>

      <button type="submit" className={buttonClasses("primary", "md", "mt-4")}>
        Run my audit
      </button>

      {status === "error" && error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </form>
  );
}
