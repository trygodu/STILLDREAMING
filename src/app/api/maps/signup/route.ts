import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { PORTAL_COOKIE, createSessionToken, verifySessionToken } from "@/lib/auth";
import { createClient, findClientByEmail } from "@/lib/clients";
import { createLead, isValidEmail } from "@/lib/leads";
import { runMapsAudit, scoreMapsListing } from "@/lib/maps-audit";
import { generateMapsProposal } from "@/lib/pitchDeck";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "Enter your business name and location." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingClientId = verifySessionToken(cookieStore.get(PORTAL_COOKIE)?.value);

  let clientId: string;
  let leadId: string | null;
  let setCookie = false;

  if (existingClientId) {
    const existing = await prisma.client.findUnique({ where: { id: existingClientId } });
    if (!existing) {
      return NextResponse.json({ error: "Your session expired — sign in again." }, { status: 401 });
    }
    clientId = existing.id;
    leadId = existing.leadId;
  } else {
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name : null;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (await findClientByEmail(email)) {
      return NextResponse.json(
        { error: "An account with that email already exists — sign in and run this from your portal instead." },
        { status: 409 }
      );
    }

    const lead = await createLead({
      email,
      name,
      source: "MAPS_FUNNEL",
      message: `Google Maps audit requested for: ${query}`,
      page: typeof body.page === "string" ? body.page : null,
      referrer: typeof body.referrer === "string" ? body.referrer : null,
      utmSource: typeof body.utmSource === "string" ? body.utmSource : null,
      utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : null,
      utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign : null,
    });

    const client = await createClient({ name, email, password, leadId: lead.id });
    clientId = client.id;
    leadId = lead.id;
    setCookie = true;
  }

  const data = await runMapsAudit(query);
  const score = scoreMapsListing(data);
  const { content: proposal, demo } = await generateMapsProposal(query, data);

  const reportPayload = {
    query,
    placeId: data.placeId ?? null,
    score,
    data: JSON.parse(JSON.stringify(data)),
    proposal: JSON.parse(JSON.stringify(proposal)),
  };

  await prisma.mapsReport.upsert({
    where: { clientId },
    create: { clientId, ...reportPayload },
    update: reportPayload,
  });

  if (leadId) {
    await prisma.activity.create({
      data: {
        leadId,
        type: "MAPS_AUDIT_GENERATED",
        detail: `Maps audit for "${query}" — score ${score}/100${demo ? " (demo mode)" : ""}.`,
      },
    });
  }

  const response = NextResponse.json({ ok: true });
  if (setCookie) {
    response.cookies.set(PORTAL_COOKIE, createSessionToken(clientId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}
