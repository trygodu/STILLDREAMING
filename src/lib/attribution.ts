"use client";

/** Captures where a visitor came from so it can ride along on lead/chat/track payloads. */
export function getAttribution() {
  if (typeof window === "undefined") {
    return { page: null, referrer: null, utmSource: null, utmMedium: null, utmCampaign: null };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    page: window.location.pathname,
    referrer: document.referrer || null,
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
  };
}

const SESSION_KEY = "sd_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
