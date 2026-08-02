import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/admin";
  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
