import { NextResponse } from "next/server";
import { createSessionToken, ADMIN_COOKIE } from "@/lib/auth";
import { createUser, userCount } from "@/lib/users";
import { isValidEmail } from "@/lib/leads";

export async function POST(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/admin";

  // Bootstrap-only: once the first account exists, this route always 403s so
  // a stranger can't mint themselves admin access later.
  if ((await userCount()) > 0) {
    return NextResponse.json({ error: "Setup already completed." }, { status: 403 });
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "");

  if (!isValidEmail(email) || password.length < 8) {
    url.searchParams.set("error", "1");
    return NextResponse.redirect(url, { status: 303 });
  }

  const user = await createUser(email, password, name);

  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
