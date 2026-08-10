import { NextResponse } from "next/server";
import { createSessionToken, PORTAL_COOKIE } from "@/lib/auth";
import { verifyClientCredentials } from "@/lib/clients";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  const url = new URL(request.url);
  url.pathname = "/portal";

  const client = await verifyClientCredentials(email, password);
  if (!client) {
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  url.searchParams.delete("error");
  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.set(PORTAL_COOKIE, createSessionToken(client.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
