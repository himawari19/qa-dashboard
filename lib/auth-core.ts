const COOKIE_NAME = "qa_daily_session";

export function normalizeRole(role: string | null | undefined) {
  const value = String(role ?? "").trim();
  if (!value) return "";
  if (value === "Admin (Owner)") return "admin";
  return value.toLowerCase();
}

export function isAdminUser(role: string | null | undefined, company: string | null | undefined) {
  return normalizeRole(role) === "admin" && !String(company ?? "").trim();
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
    const user = await db.get('SELECT * FROM "User" WHERE "email" = ? AND "password" = ?', [email, hashedPassword]);
    return !!user;
  } catch (err) {
    console.error("Auth DB error:", err);
    return false;
  }
}

export async function registerUser(email: string, password: string, name?: string, role: string = 'user', company: string = '') {
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

export async function createSessionToken(email: string) {
  const { secret } = getAuthConfig();
  if (!secret) {
    throw new Error("AUTH_SECRET is required.");
  }
  const payload = toBase64UrlBytes(JSON.stringify({ email, ts: Date.now() }));
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  const { secret } = getAuthConfig();
  if (!token || !secret) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if ((await sign(payload, secret)) !== signature) return false;
  try {
    const decoded = JSON.parse(fromBase64UrlBytes(payload)) as { email?: string; ts?: number };
    try {
      const { db } = await import("./db");
      const user = await db.get('SELECT id FROM "User" WHERE "email" = ?', [decoded.email]);
      if (!user) return false;
    } catch {
      return false;
    }
    
    // 6-hour session duration check
    const SESSION_DURATION = 6 * 60 * 60 * 1000;
    if (decoded.ts && Date.now() - decoded.ts > SESSION_DURATION) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentUser() {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  
  const [payload] = token.split(".");
  if (!payload) return null;
  
  try {
    const decoded = JSON.parse(fromBase64UrlBytes(payload)) as { email?: string };
    const email = decoded.email;
    if (!email) return null;

    const { db } = await import("./db");
    const user = await db.get<{
      id: number;
      name: string;
      email: string;
      role: string;
      company: string;
    }>('SELECT id, name, email, role, company FROM "User" WHERE "email" = ?', [email]);

    if (user) {
      return {
        ...user,
        role: normalizeRole(user.role),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function sessionCookieName() {
  return COOKIE_NAME;
}
