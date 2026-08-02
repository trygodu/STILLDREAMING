"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAttribution, getSessionId } from "@/lib/attribution";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const attribution = getAttribution();
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...attribution, path: pathname, sessionId: getSessionId() }),
      keepalive: true,
    }).catch(() => {
      // Analytics beacon — never worth surfacing an error to the visitor.
    });
  }, [pathname]);

  return null;
}
