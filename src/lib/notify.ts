import { prisma } from "@/lib/db";
import type { Lead } from "@/generated/prisma/client";

/**
 * "Automated" outreach step: notify the site owner the moment a lead comes
 * in. Uses Resend when a key is configured; otherwise logs and records the
 * activity as queued so the automation pipeline is visibly wired up even
 * before real credentials are added.
 */
export async function notifyNewLead(lead: Lead) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_EMAIL;

  const subject = `New ${lead.source.toLowerCase().replace("_", " ")} lead: ${lead.email}`;
  const body = [
    `Name: ${lead.name ?? "—"}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company ?? "—"}`,
    `Source: ${lead.source}`,
    `Score: ${lead.score}/100`,
    `Message: ${lead.message ?? "—"}`,
  ].join("\n");

  if (!apiKey || !to) {
    console.log(`[demo mode] would send email notification:\n${subject}\n${body}`);
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "EMAIL_QUEUED",
        detail: "No RESEND_API_KEY / LEAD_NOTIFICATION_EMAIL configured — notification logged instead of sent.",
      },
    });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Still Dreaming Leads <leads@trygodu.com>",
      to: [to],
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: "EMAIL_QUEUED",
        detail: `Resend request failed (${res.status}): ${detail.slice(0, 300)}`,
      },
    });
    return;
  }

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      type: "EMAIL_SENT",
      detail: `Notification emailed to ${to}.`,
    },
  });
}
