const COOKIE_NAME = "qa_daily_session";

function getAuthConfig() {
  const username = process.env.AUTH_USERNAME || "";
  const password = process.env.AUTH_PASSWORD || "";
  const secret = process.env.AUTH_SECRET || "";
  return { username, password, secret };
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

async function hashPassword(password: string) {
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
  const { username, password, secret } = getAuthConfig();
  return Boolean(username && password && secret);
}

export async function validateCredentials(username: string, password: string) {
  const config = getAuthConfig();
  
  // Try static credentials first
  if (config.username && config.password && username === config.username && password === config.password) {
    return true;
  }

  // Then try database
  try {
    const { db } = await import("./db");
    const hashedPassword = await hashPassword(password);
    const user = await db.get('SELECT * FROM "User" WHERE "username" = ? AND "password" = ?', [username, hashedPassword]);
    return !!user;
  } catch (err) {
    console.error("Auth DB error:", err);
    return false;
  }
}

export async function registerUser(username: string, password: string, name?: string) {
  try {
    const { db } = await import("./db");
    const hashedPassword = await hashPassword(password);
    await db.run('INSERT INTO "User" ("username", "password", "name") VALUES (?, ?, ?)', [username, hashedPassword, name || username]);
    return { success: true };
  } catch (err: any) {
    if (err.message?.includes("UNIQUE constraint") || err.code === "23505") {
      return { error: "Username already exists." };
    }
    return { error: "Registration failed." };
  }
}

export async function createSessionToken(username: string) {
  const { secret } = getAuthConfig();
  if (!secret) {
    throw new Error("AUTH_SECRET is required.");
  }
  const payload = toBase64UrlBytes(JSON.stringify({ username, ts: Date.now() }));
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  const { secret, username } = getAuthConfig();
  if (!token || !secret || !username) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if ((await sign(payload, secret)) !== signature) return false;
  try {
    const decoded = JSON.parse(fromBase64UrlBytes(payload)) as { username?: string; ts?: number };
    
    // Check static username or DB
    if (decoded.username === username) return true;
    
    try {
      const { db } = await import("./db");
      const user = await db.get('SELECT id FROM "User" WHERE "username" = ?', [decoded.username]);
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

export function sessionCookieName() {
  return COOKIE_NAME;
}
