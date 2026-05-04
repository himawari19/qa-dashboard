import { NextResponse } from "next/server";
import { authEnabled, isLoggedIn, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    authEnabled: authEnabled(),
    authenticated: await isLoggedIn(),
    user,
  });
}
