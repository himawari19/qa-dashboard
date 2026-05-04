import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    get: vi.fn(),
    run: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  db: mocks.db,
}));

import {
  authEnabled,
  createSessionToken,
  hashPassword,
  isAdminUser,
  normalizeRole,
  registerUser,
  sessionCookieName,
  validateCredentials,
  verifySessionToken,
} from "@/lib/auth-core";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("AUTH_SECRET", "");
  vi.clearAllMocks();
  mocks.db.get.mockResolvedValue(undefined);
  mocks.db.run.mockResolvedValue(undefined);
});

describe("auth-core", () => {
  it("normalizes roles and admin detection", () => {
    expect(normalizeRole("Admin (Owner)")).toBe("admin");
    expect(normalizeRole(" Lead ")).toBe("lead");
    expect(isAdminUser("admin", "")).toBe(true);
    expect(isAdminUser("admin", "acme")).toBe(false);
  });

  it("detects auth config availability", () => {
    expect(authEnabled()).toBe(false);
    vi.stubEnv("AUTH_SECRET", "topsecret");
    expect(authEnabled()).toBe(true);
  });

  it("hashes passwords deterministically", async () => {
    const hash = await hashPassword("secret");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("creates and verifies session tokens", async () => {
    vi.stubEnv("AUTH_SECRET", "topsecret");
    mocks.db.get.mockResolvedValueOnce({ id: 1 });

    const token = await createSessionToken("admin");

    expect(token).toContain(".");
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("verifies database-backed sessions and rejects expired ones", async () => {
    vi.stubEnv("AUTH_SECRET", "topsecret");
    mocks.db.get.mockResolvedValueOnce({ id: 1 });

    const token = await createSessionToken("user@example.com");

    expect(await verifySessionToken(token)).toBe(true);
    expect(mocks.db.get).toHaveBeenCalledWith('SELECT id FROM "User" WHERE "email" = ?', ["user@example.com"]);

    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 6 * 60 * 60 * 1000 + 1);
    expect(await verifySessionToken(token)).toBe(false);
    vi.restoreAllMocks();
  });

  it("validates static and database credentials", async () => {
    vi.stubEnv("AUTH_SECRET", "topsecret");
    mocks.db.get.mockResolvedValueOnce({ id: 1 });
    expect(await validateCredentials("user@example.com", "secret")).toBe(true);
    expect(mocks.db.get).toHaveBeenCalledWith('SELECT * FROM "User" WHERE "email" = ? AND "password" = ?', [
      "user@example.com",
      expect.any(String),
    ]);
  });

  it("registers users and maps unique errors", async () => {
    await expect(registerUser("user@example.com", "secret", "User", "editor", "acme")).resolves.toEqual({ success: true });
    expect(mocks.db.run).toHaveBeenCalledWith(
      'INSERT INTO "User" ("email", "password", "name", "role", "company") VALUES (?, ?, ?, ?, ?)',
      ["user@example.com", expect.any(String), "User", "editor", "acme"],
    );

    mocks.db.run.mockRejectedValueOnce({ message: "UNIQUE constraint failed", code: "SQLITE_CONSTRAINT" });
    await expect(registerUser("user@example.com", "secret")).resolves.toEqual({ error: "Email already exists." });
  });

  it("exposes the cookie name", () => {
    expect(sessionCookieName()).toBe("qa_daily_session");
  });
});
