import { NextResponse } from "next/server";
import { createLead, isValidEmail } from "@/lib/leads";
import type { LeadInput } from "@/lib/leads";

const VALID_SOURCES: LeadInput["source"][] = [
  "CONTACT_FORM",
  "AUDIT_FUNNEL",
  "CHATBOT",
  "NEWSLETTER",
];

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const source = VALID_SOURCES.includes(body.source as LeadInput["source"])
    ? (body.source as LeadInput["source"])
    : "CONTACT_FORM";

  const lead = await createLead({
    email,
    source,
    name: typeof body.name === "string" ? body.name : null,
    company: typeof body.company === "string" ? body.company : null,
    message: typeof body.message === "string" ? body.message : null,
    page: typeof body.page === "string" ? body.page : null,
    referrer: typeof body.referrer === "string" ? body.referrer : null,
    utmSource: typeof body.utmSource === "string" ? body.utmSource : null,
    utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : null,
    utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign : null,
  });

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
