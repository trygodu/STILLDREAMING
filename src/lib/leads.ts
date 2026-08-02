import { prisma } from "@/lib/db";
import { notifyNewLead } from "@/lib/notify";
import type { LeadSource } from "@/generated/prisma/enums";

export interface LeadInput {
  name?: string | null;
  email: string;
  company?: string | null;
  message?: string | null;
  source: LeadSource;
  page?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/**
 * Deterministic lead scoring so the "automation" in the admin dashboard has
 * something real to show — not just a list of names. Weighted toward
 * signals that correlate with buying intent, not just form completeness.
 */
export function scoreLead(input: LeadInput): number {
  let score = 10;

  if (input.company) score += 20;
  if (input.message && input.message.trim().length > 40) score += 15;
  if (input.source === "AUDIT_FUNNEL") score += 25;
  if (input.source === "CHATBOT") score += 15;
  if (input.utmSource) score += 10;
  if (input.name) score += 5;

  return Math.min(score, 100);
}

export async function createLead(input: LeadInput) {
  const score = scoreLead(input);

  const lead = await prisma.lead.create({
    data: {
      name: input.name?.trim() || null,
      email: input.email.trim().toLowerCase(),
      company: input.company?.trim() || null,
      message: input.message?.trim() || null,
      source: input.source,
      score,
      page: input.page ?? null,
      referrer: input.referrer ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      activities: {
        create: {
          type: "LEAD_CREATED",
          detail: `Captured from ${input.source} (score ${score}).`,
        },
      },
    },
  });

  // Fire-and-forget: the lead is already saved, a notification hiccup
  // should never fail the request that created it.
  notifyNewLead(lead).catch((err) => {
    console.error("notifyNewLead failed", err);
  });

  return lead;
}
