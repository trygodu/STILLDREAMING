import { NextResponse } from "next/server";
import { PORTAL_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/portal";
  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.delete(PORTAL_COOKIE);
  return response;
}
