import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAssistantReply, extractEmail, extractWebsite, type ChatTurn } from "@/lib/chat";
import { createLead, isValidEmail } from "@/lib/leads";

const HISTORY_LIMIT = 20;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!sessionId || !message) {
    return NextResponse.json({ error: "sessionId and message are required." }, { status: 400 });
  }

  const priorMessages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: HISTORY_LIMIT,
  });

  let leadId = priorMessages.find((m) => m.leadId)?.leadId ?? null;

  await prisma.chatMessage.create({
    data: { sessionId, role: "USER", content: message, leadId },
  });

  // Capture a lead the moment a visitor volunteers an email mid-conversation.
  const candidateEmail = extractEmail(message);
  if (!leadId && candidateEmail && isValidEmail(candidateEmail)) {
    const transcript = [...priorMessages.map((m) => `${m.role}: ${m.content}`), `USER: ${message}`].join("\n");

    const lead = await createLead({
      email: candidateEmail,
      source: "CHATBOT",
      website: extractWebsite(transcript),
      message: transcript.slice(0, 2000),
      page: typeof body.page === "string" ? body.page : null,
      referrer: typeof body.referrer === "string" ? body.referrer : null,
      utmSource: typeof body.utmSource === "string" ? body.utmSource : null,
      utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : null,
      utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign : null,
    });
    leadId = lead.id;

    await prisma.$transaction([
      prisma.chatMessage.updateMany({ where: { sessionId }, data: { leadId } }),
      prisma.activity.create({
        data: { leadId, type: "CHAT_HANDOFF", detail: "Lead captured automatically from chatbot conversation." },
      }),
    ]);
  }

  const history: ChatTurn[] = [
    ...priorMessages.map((m) => ({
      role: m.role === "ASSISTANT" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const { reply, demo } = await getAssistantReply(history);

  await prisma.chatMessage.create({
    data: { sessionId, role: "ASSISTANT", content: reply, leadId },
  });

  return NextResponse.json({ reply, demo, leadCaptured: Boolean(leadId && candidateEmail) });
}
