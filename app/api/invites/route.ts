import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth-core";
import { createInvite, listInvites } from "@/lib/invites";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = request.nextUrl.searchParams.get("company")?.trim() || user.company || "";
  if (!isAdminUser(user.role, user.company) && company !== user.company) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const invites = await listInvites(company);
  return NextResponse.json({ invites });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user.role, user.company)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    company?: string;
    role?: string;
    expiresInDays?: number;
  } | null;

  const result = await createInvite({
    company: body?.company || "",
    role: body?.role || "viewer",
    expiresInDays: body?.expiresInDays,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  return NextResponse.json({
    invite: result,
    link: `${origin}/invite/${result.token}`,
  });
}
