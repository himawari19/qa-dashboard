import { cookies } from "next/headers";
import { authEnabled, createSessionToken, sessionCookieName, validateCredentials, verifySessionToken } from "@/lib/auth-core";

export { authEnabled, createSessionToken, sessionCookieName, validateCredentials, verifySessionToken };

export async function getSessionCookie() {
  return (await cookies()).get(sessionCookieName())?.value;
}

export async function isLoggedIn() {
  return verifySessionToken(await getSessionCookie());
}
