import { NextRequest, NextResponse } from "next/server";
import { registerUser, createSessionToken, sessionCookieName, authEnabled } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!authEnabled()) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => null) as { username?: string; password?: string; name?: string } | null;
  const username = body?.username?.trim() || "";
  const password = body?.password || "";
  const name = body?.name?.trim() || "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const result = await registerUser(username, password, name);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
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
