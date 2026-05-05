import { NextResponse } from "next/server";
import { authEnabled, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    authEnabled: authEnabled(),
    authenticated: !!user,
    user,
  });
}
