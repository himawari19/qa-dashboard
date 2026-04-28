import { NextRequest, NextResponse } from "next/server";
import { registerUser, createSessionToken, sessionCookieName, authEnabled } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!authEnabled()) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => null) as { username?: string; password?: string; name?: string; role?: string; company?: string } | null;
  const username = body?.username?.trim() || "";
  const password = body?.password || "";
  const name = body?.name?.trim() || "";
  const role = body?.role?.trim() || "QA Engineer";
  const company = body?.company?.trim() || "";

  if (!username || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (!company) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }

  const result = await registerUser(username, password, name, role, company);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
