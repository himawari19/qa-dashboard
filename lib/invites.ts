import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser, normalizeRole } from "@/lib/auth-core";

type InviteRow = {
  id: number;
  token: string;
  company: string;
  role: string;
  status: string;
  createdBy: string;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type InviteInput = {
  company: string;
  role: string;
  expiresInDays?: number;
};

function makeToken() {
  return randomBytes(18).toString("base64url");
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function getInviteByToken(token: string) {
  return db.get<InviteRow>('SELECT * FROM "Invite" WHERE "token" = ?', [token]);
}

export async function listInvites(company: string) {
  return db.query<InviteRow>('SELECT * FROM "Invite" WHERE "company" = ? ORDER BY "createdAt" DESC', [company]);
}

export async function createInvite(input: InviteInput) {
  const user = await getCurrentUser();
  const company = String(input.company ?? "").trim();
  const role = normalizeRole(input.role) || "viewer";
  const expiresInDays = Number.isFinite(input.expiresInDays ?? NaN) ? Number(input.expiresInDays) : 7;
  if (!company) {
    return { error: "Company is required." } as const;
  }
  if (!user || !isAdminUser(user.role, user.company)) {
    return { error: "Unauthorized" } as const;
  }

  const token = makeToken();
  const expiresAt = addDays(Math.max(1, Math.min(expiresInDays, 30)));
  await db.run(
    'INSERT INTO "Invite" ("token", "company", "role", "status", "createdBy", "expiresAt") VALUES (?, ?, ?, ?, ?, ?)',
    [token, company, role, "pending", user.username, expiresAt],
  );

  return {
    token,
    company,
    role,
    expiresAt,
  } as const;
}

export async function revokeInvite(token: string) {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user.role, user.company)) {
    return { error: "Unauthorized" } as const;
  }
  await db.run('UPDATE "Invite" SET "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "token" = ?', ["revoked", token]);
  return { ok: true } as const;
}

export async function acceptInvite(token: string, username: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" } as const;

  const invite = await getInviteByToken(token);
  if (!invite) return { error: "Invite not found." } as const;
  if (invite.status !== "pending") return { error: "Invite is not active." } as const;
  if (new Date(String(invite.expiresAt)).getTime() < Date.now()) {
    await db.run('UPDATE "Invite" SET "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "token" = ?', ["expired", token]);
    return { error: "Invite expired." } as const;
  }

  const existingUser = await db.get<{ id: number; username: string }>('SELECT id, username FROM "User" WHERE "username" = ?', [username]);
  if (!existingUser) {
    return { error: "User not found." } as const;
  }

  await db.run(
    'UPDATE "User" SET "company" = ?, "role" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "username" = ?',
    [invite.company, invite.role, username],
  );
  await db.run(
    'UPDATE "Invite" SET "status" = ?, "acceptedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "token" = ?',
    ["accepted", token],
  );
  return { ok: true, company: invite.company, role: invite.role } as const;
}
