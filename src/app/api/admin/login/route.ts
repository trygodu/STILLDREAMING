import { NextResponse } from "next/server";
import { checkAdminPassword, createAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  const url = new URL(request.url);

  if (!checkAdminPassword(password)) {
    url.pathname = "/admin";
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  url.pathname = "/admin";
  url.searchParams.delete("error");
  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
