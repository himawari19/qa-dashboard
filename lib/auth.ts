import { cookies } from "next/headers";
import { authEnabled, createSessionToken, sessionCookieName, validateCredentials, verifySessionToken, registerUser, getCurrentUser } from "@/lib/auth-core";

export { authEnabled, createSessionToken, sessionCookieName, validateCredentials, verifySessionToken, registerUser, getCurrentUser };

export async function getSessionCookie() {
  return (await cookies()).get(sessionCookieName())?.value;
}

export async function isLoggedIn() {
  return verifySessionToken(await getSessionCookie());
}
