import { syncAssigneeFromUser } from "@/lib/user-assignee-sync";
import {
  WORKSPACE_ROLES,
  INVITE_ROLES,
  normalizeRole,
  isAdminUser,
  isInviteRole,
  getRoleLabel,
  getInviteRoleOptions,
  getPublicRoleOptions,
} from "@/lib/roles";

const COOKIE_NAME = "qa_daily_session";

export { WORKSPACE_ROLES, INVITE_ROLES, normalizeRole, isAdminUser, isInviteRole, getRoleLabel, getInviteRoleOptions, getPublicRoleOptions };

function getAuthConfig() {
  const secret = process.env.AUTH_SECRET || "";
  return { secret };
}

function toBase64UrlBytes(input: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64url");
  }
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlBytes(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf8");
  }
  return atob(normalized);
}

export async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sign(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const bytes = new Uint8Array(signature);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return typeof Buffer !== "undefined"
    ? Buffer.from(bytes).toString("base64url")
    : btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function authEnabled() {
  const { secret } = getAuthConfig();
  return Boolean(secret);
}

export async function validateCredentials(email: string, password: string) {
  try {
    const { db } = await import("./db");
    const hashedPassword = await hashPassword(password);
    const user = await db.get<{ id: number; name: string; email: string; role: string; company: string }>(
      'SELECT id, name, email, role, company FROM "User" WHERE "email" = ? AND "password" = ?',
      [email, hashedPassword]
    );
    return user ?? null;
  } catch (err) {
    console.error("Auth DB error:", err);
    return null;
  }
}

export async function registerUser(email: string, password: string, name?: string, role: string = "qa", company: string = "") {
  try {
    const { db } = await import("./db");
    const hashedPassword = await hashPassword(password);
    await db.run('INSERT INTO "User" ("email", "password", "name", "role", "company") VALUES (?, ?, ?, ?, ?)', [email, hashedPassword, name || email, role, company]);
    const user = await db.get<{ id: number; company: string; name: string | null; email: string | null; role: string | null }>(
      'SELECT "id", "company", "name", "email", "role" FROM "User" WHERE "email" = ?',
      [email],
    );
    if (user) {
      await syncAssigneeFromUser(user);
    }
    return { success: true };
  } catch (err: any) {
    if (err.message?.includes("UNIQUE constraint") || err.code === "23505") {
      return { error: "Email address is already registered. Please use a different email." };
    }
    return { error: "Registration failed. Please try again later." };
  }
}

export async function createSessionToken(
  email: string,
  user?: { id: number; name: string; role: string; company: string }
) {
  const { secret } = getAuthConfig();
  if (!secret) {
    throw new Error("AUTH_SECRET is required.");
  }
  const payload = toBase64UrlBytes(JSON.stringify({
    email,
    ts: Date.now(),
    ...(user ? { id: user.id, name: user.name, role: user.role, company: user.company } : {}),
  }));
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

const SESSION_DURATION = 6 * 60 * 60 * 1000;

export async function verifySessionToken(token: string | undefined | null) {
  const { secret } = getAuthConfig();
  if (!token || !secret) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if ((await sign(payload, secret)) !== signature) return false;
  try {
    const decoded = JSON.parse(fromBase64UrlBytes(payload)) as { email?: string; ts?: number };
    if (decoded.ts && Date.now() - decoded.ts > SESSION_DURATION) return false;
    return Boolean(decoded.email);
  } catch {
    return false;
  }
}

export async function getCurrentUser() {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { secret } = getAuthConfig();
  if (!secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  // Verify HMAC before trusting payload
  if ((await sign(payload, secret)) !== signature) return null;

  try {
    const decoded = JSON.parse(fromBase64UrlBytes(payload)) as {
      email?: string; ts?: number;
      id?: number; name?: string; role?: string; company?: string;
    };
    if (!decoded.email) return null;
    if (decoded.ts && Date.now() - decoded.ts > SESSION_DURATION) return null;

    // Fast path: user data embedded in token (new tokens after login)
    if (decoded.id && decoded.name !== undefined && decoded.role !== undefined && decoded.company !== undefined) {
      return {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: normalizeRole(decoded.role),
        company: decoded.company,
      };
    }

    // Fallback: old tokens without embedded user data — hit DB once
    const { db } = await import("./db");
    const user = await db.get<{ id: number; name: string; email: string; role: string; company: string }>(
      'SELECT id, name, email, role, company FROM "User" WHERE "email" = ?',
      [decoded.email]
    );
    if (!user) return null;
    return { ...user, role: normalizeRole(user.role) };
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return COOKIE_NAME;
}
