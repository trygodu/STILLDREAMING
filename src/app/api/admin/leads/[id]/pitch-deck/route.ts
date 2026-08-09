import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { fetchSiteSignals } from "@/lib/site-audit";
import { generateDeckContent, buildDeckBuffer } from "@/lib/pitchDeck";

export async function GET(request: Request, ctx: RouteContext<"/api/admin/leads/[id]/pitch-deck">) {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const signals = lead.website ? await fetchSiteSignals(lead.website) : null;
  const { content, demo } = await generateDeckContent(lead, signals);
  const buffer = await buildDeckBuffer(content);

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      type: "PITCH_DECK_GENERATED",
      detail: `Pitch deck generated (${content.sections.length} sections)${demo ? " — demo mode" : ""}.`,
    },
  });

  const stem = (lead.company || lead.name || lead.email).replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${stem}-proposal.pptx"`,
    },
  });
}
