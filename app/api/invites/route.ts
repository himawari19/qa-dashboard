import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isInviteRole, isWorkspaceAdmin, normalizeRole } from "@/lib/roles";
import { createInvite, listInvites } from "@/lib/invites";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isWorkspaceAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const invites = await listInvites();
  return NextResponse.json({ invites });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isWorkspaceAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    role?: string;
    expiresInDays?: number;
  } | null;

  const result = await createInvite({
    role: isInviteRole(body?.role) ? normalizeRole(body?.role) : "qa",
    expiresInDays: body?.expiresInDays,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  return NextResponse.json({
    invite: result,
    link: `${origin}/register?inviteToken=${result.token}`,
  });
}
