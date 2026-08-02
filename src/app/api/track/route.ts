import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path : null;
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  if (!path || !sessionId) {
    return NextResponse.json({ error: "path and sessionId are required." }, { status: 400 });
  }

  await prisma.pageView.create({
    data: {
      path,
      sessionId,
      referrer: typeof body.referrer === "string" ? body.referrer : null,
      utmSource: typeof body.utmSource === "string" ? body.utmSource : null,
      utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : null,
      utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign : null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
