import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, PORTAL_COOKIE } from "@/lib/auth";
import { createClient, findClientByEmail } from "@/lib/clients";
import { createLead, isValidEmail, normalizeWebsiteUrl } from "@/lib/leads";
import { fetchSiteSignals, scoreSiteAudit } from "@/lib/site-audit";
import { generateDeckContent } from "@/lib/pitchDeck";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name : null;
  const company = typeof body.company === "string" ? body.company : null;
  const website = normalizeWebsiteUrl(typeof body.website === "string" ? body.website : null);

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!website) {
    return NextResponse.json({ error: "A valid website URL is required." }, { status: 400 });
  }

  if (await findClientByEmail(email)) {
    return NextResponse.json(
      { error: "An account with that email already exists — log in instead." },
      { status: 409 }
    );
  }

  const lead = await createLead({
    email,
    name,
    company,
    website,
    source: "AUDIT_FUNNEL",
    page: typeof body.page === "string" ? body.page : null,
    referrer: typeof body.referrer === "string" ? body.referrer : null,
    utmSource: typeof body.utmSource === "string" ? body.utmSource : null,
    utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : null,
    utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign : null,
  });

  const client = await createClient({ name, email, password, website, company, leadId: lead.id });

  const signals = await fetchSiteSignals(website);
  const score = scoreSiteAudit(signals);
  const { content: proposal } = await generateDeckContent(lead, signals);

  await prisma.$transaction([
    prisma.auditReport.create({
      data: {
        clientId: client.id,
        website,
        score,
        signals: JSON.parse(JSON.stringify(signals)),
        proposal: JSON.parse(JSON.stringify(proposal)),
      },
    }),
    prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "PORTAL_ACCOUNT_CREATED",
        detail: `Portal account created; site score ${score}/100.`,
      },
    }),
  ]);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PORTAL_COOKIE, createSessionToken(client.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
