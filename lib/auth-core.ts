const COOKIE_NAME = "qa_daily_session";
export const WORKSPACE_ROLES = ["admin", "fe", "be", "fullstack", "qa", "pm"] as const;
export const INVITE_ROLES = ["fe", "be", "fullstack", "qa", "pm"] as const;

const ROLE_ALIASES: Record<string, string> = {
  "admin (owner)": "admin",
  "super admin": "admin",
  superadmin: "admin",
  owner: "admin",
  admin: "admin",
  "frontend developer": "fe",
  frontend: "fe",
  fe: "fe",
  "backend developer": "be",
  backend: "be",
  be: "be",
  "fullstack developer": "fullstack",
  fullstack: "fullstack",
  "qa engineer": "qa",
  "qa automation engineer": "qa",
  qa: "qa",
  "product manager": "pm",
  "project manager": "pm",
  pm: "pm",
  lead: "pm",
  editor: "fullstack",
  viewer: "qa",
  user: "qa",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin",
  fe: "FE",
  be: "BE",
  fullstack: "Fullstack",
  qa: "QA",
  pm: "PM",
};

export function normalizeRole(role: string | null | undefined) {
  const value = String(role ?? "").trim();
  if (!value) return "";
  const lowered = value.toLowerCase();
  return ROLE_ALIASES[lowered] || lowered;
}

export function isAdminUser(role: string | null | undefined, company: string | null | undefined) {
  return normalizeRole(role) === "admin" && !String(company ?? "").trim();
}

export function isInviteRole(role: string | null | undefined) {
  return INVITE_ROLES.includes(normalizeRole(role) as (typeof INVITE_ROLES)[number]);
}

export function getRoleLabel(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return ROLE_LABELS[normalized] || (normalized ? normalized.toUpperCase() : "-");
}

export function getInviteRoleOptions() {
  return INVITE_ROLES.map((value) => ({ label: ROLE_LABELS[value], value }));
}

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
    return { success: true };
  } catch (err: any) {
    if (err.message?.includes("UNIQUE constraint") || err.code === "23505") {
      return { error: "Email already exists." };
    }
    return { error: "Registration failed." };
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
