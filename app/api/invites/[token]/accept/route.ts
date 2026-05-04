import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { acceptInvite } from "@/lib/invites";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;
  const body = await request.json().catch(() => null) as { username?: string } | null;
  const result = await acceptInvite(token, body?.username?.trim() || user.username);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
