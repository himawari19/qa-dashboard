import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, validateCredentials, sessionCookieName, authEnabled } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!authEnabled()) {
    return NextResponse.json({ error: "Login is not configured. Please contact your administrator." }, { status: 500 });
  }

  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  const username = body?.username?.trim() || "";
  const password = body?.password || "";

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = await createSessionToken(username);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
  return response;
}
