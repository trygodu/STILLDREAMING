import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import type { LeadStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];

export async function POST(request: Request, ctx: RouteContext<"/api/admin/leads/[id]/status">) {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const form = await request.formData();
  const status = String(form.get("status") ?? "");

  if (!VALID_STATUSES.includes(status as LeadStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.lead.update({ where: { id }, data: { status: status as LeadStatus } }),
    prisma.activity.create({
      data: { leadId: id, type: "STATUS_CHANGED", detail: `Status set to ${status}.` },
    }),
  ]);

  const url = new URL(request.url);
  url.pathname = "/admin";
  return NextResponse.redirect(url, { status: 303 });
}
