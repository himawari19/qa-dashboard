import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth-core";

const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me",
  "/favicon.ico",
  "/_next",
  "/api/upload",
  "/invite/",
  "/report/",
  "/test-plans/",
  "/test-suites/",
  "/test-cases/detail/",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("qa_daily_session")?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
