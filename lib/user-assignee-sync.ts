import { db } from "@/lib/db";
import { isAssignableRole, normalizeRole } from "@/lib/roles";

type UserRow = {
  id: number;
  company: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

export async function syncAssigneeFromUser(user: UserRow) {
  const name = normalizeText(user.name) || normalizeText(user.email) || `User ${user.id}`;
  const email = normalizeText(user.email);
  const role = normalizeRole(user.role);
  const company = normalizeText(user.company);

  if (!isAssignableRole(role)) {
    await deleteAssigneeForUser(user.id);
    return;
  }

  await db.run(
    `UPDATE "Assignee"
     SET "company" = ?,
         "name" = ?,
         "role" = ?,
         "email" = ?,
         "skills" = ?,
         "status" = ?,
         "deletedAt" = NULL,
         "updatedAt" = CURRENT_TIMESTAMP
     WHERE "userId" = ?`,
    [company, name, role, email, "", "active", user.id],
  );

  const existing = await db.get<{ id: number }>(`SELECT "id" FROM "Assignee" WHERE "userId" = ?`, [user.id]);
  if (!existing) {
    try {
      await db.run(
        `INSERT INTO "Assignee" ("company", "userId", "name", "role", "email", "skills", "status", "deletedAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, CURRENT_TIMESTAMP)`,
        [company, user.id, name, role, email, "", "active"],
      );
    } catch {
      await db.run(
        `UPDATE "Assignee"
         SET "company" = ?,
             "name" = ?,
             "role" = ?,
             "email" = ?,
             "skills" = ?,
             "status" = ?,
             "deletedAt" = NULL,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "userId" = ?`,
        [company, name, role, email, "", "active", user.id],
      );
    }
  }
}

export async function deleteAssigneeForUser(userId: number) {
  await db.run('UPDATE "Assignee" SET "deletedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = ?', [userId]);
}

export async function backfillAssigneesFromUsers() {
  const users = await db.query<UserRow>(
    `SELECT "id", "company", "name", "email", "role"
     FROM "User"
     WHERE COALESCE("email", '') != ''`,
  );

  await db.transaction(async () => {
    for (const user of users) {
      await syncAssigneeFromUser(user);
    }
  });
}
