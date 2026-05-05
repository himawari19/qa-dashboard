import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, validateCredentials, sessionCookieName } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = body?.email?.trim() || "";
  const password = body?.password || "";

  const user = await validateCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await createSessionToken(email, user);
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
