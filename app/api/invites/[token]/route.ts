import { NextRequest, NextResponse } from "next/server";
import { revokeInvite } from "@/lib/invites";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await revokeInvite(token);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json(result);
}
