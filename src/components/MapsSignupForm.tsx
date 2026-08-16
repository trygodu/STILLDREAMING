"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAttribution } from "@/lib/attribution";
import { buttonClasses } from "@/lib/ui";

type Status = "idle" | "submitting" | "error";

const INPUT_CLASSES =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 transition focus:border-jade/60 focus:outline-none focus:ring-1 focus:ring-jade/30";

export default function MapsSignupForm({ alreadyLoggedIn, className }: { alreadyLoggedIn: boolean; className?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      ...getAttribution(),
      query: data.get("query"),
      name: data.get("name") || null,
      email: data.get("email") || null,
      password: data.get("password") || null,
    };

    try {
      const res = await fetch("/api/maps/signup", {
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
          Looking up {query || "your listing"} on Google Maps…
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        {!alreadyLoggedIn && (
          <>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm text-white/70">
                Name
              </label>
              <input id="name" name="name" type="text" autoComplete="name" className={INPUT_CLASSES} placeholder="Ada Lovelace" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-white/70">
                Email <span className="text-white/40">*</span>
              </label>
              <input id="email" name="email" type="email" required autoComplete="email" className={INPUT_CLASSES} placeholder="ada@example.com" />
            </div>
            <div className="sm:col-span-2">
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
          </>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="query" className="mb-1 block text-sm text-white/70">
            Business name &amp; location <span className="text-white/40">*</span>
          </label>
          <input
            id="query"
            name="query"
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={INPUT_CLASSES}
            placeholder="Still Dreaming, Toronto"
          />
        </div>
      </div>

      <button type="submit" className={buttonClasses("primary", "md", "mt-4")}>
        Run my Maps audit
      </button>

      {status === "error" && error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </form>
  );
}
