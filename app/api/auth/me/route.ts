import { NextResponse } from "next/server";
import { authEnabled, isLoggedIn } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    authEnabled: authEnabled(),
    authenticated: await isLoggedIn(),
  });
}
