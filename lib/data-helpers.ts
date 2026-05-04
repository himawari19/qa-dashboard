import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { isAdminUser } from "@/lib/auth-core";
import { getCurrentUser } from "@/lib/auth";

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

export function getAccessScope(user: CurrentUser | null = null) {
  const company = String(user?.company ?? "").trim();
  const isAdmin = isAdminUser(user?.role, company);
  const where = isAdmin ? "" : ' WHERE "company" = ?';
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const params = isAdmin ? [] : [company];
  return { company, isAdmin, where, andWhere, params };
}

export function getWriteCompany(user: CurrentUser | null, dataCompany?: string) {
  const company = String(dataCompany ?? "").trim();
  if (company) return company;
  return String(user?.company ?? "").trim();
}

export function makePublicToken() {
  return randomBytes(16).toString("base64url");
}

export function normalizeTestPlanRow(item: Record<string, unknown>) {
  return {
    ...item,
    id: String(item.id ?? ""),
    code: String(item.code && String(item.code).trim() ? item.code : ""),
    publicToken: String(item.publicToken ?? ""),
    assignee: String(item.assignee ?? ""),
  };
}

export function normalizeTestSuiteRow(item: Record<string, unknown>) {
  return {
    ...item,
    id: String(item.id ?? ""),
    testPlanId: String(item.testPlanId ?? ""),
    title: String(item.title ?? ""),
    status: String(item.status ?? ""),
    publicToken: String(item.publicToken ?? ""),
  };
}

export function normalizeTestCaseRow(item: Record<string, unknown>) {
  return {
    ...item,
    id: Number(item.id ?? 0),
    testSuiteId: String(item.testSuiteId ?? ""),
    publicToken: String(item.publicToken ?? ""),
    priority: String(item.priority ?? "Medium"),
    evidence: String(item.evidence ?? ""),
    status: String(item.status ?? "Pending"),
  };
}

export function getTableName(module: import("@/lib/modules").ModuleKey) {
  switch (module) {
    case "tasks":
      return "Task";
    case "bugs":
      return "Bug";
    case "test-cases":
      return "TestCase";
    case "test-plans":
      return "TestPlan";
    case "test-sessions":
      return "TestSession";
    case "test-suites":
      return "TestSuite";
    case "assignees":
      return "Assignee";
    case "meeting-notes":
      return "MeetingNote";
    case "sprints":
      return "Sprint";
    case "users":
      return "User";
    case "deployments":
      return "Deployment";
    default:
      console.warn(`getTableName: unhandled module key: ${module}`);
      return "";
  }
}

export function toSqliteDatetime(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export function deriveSprintStatus(startDate?: string, endDate?: string): string {
  const today = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start && today < start) return "planned";
  if (end && today > end) return "completed";
  return "active";
}

export async function logActivity(company: string, type: string, id: string, action: string, summary: string) {
  try {
    await db.run(
      `INSERT INTO "ActivityLog" ("company", "entityType", "entityId", "action", "summary")
       VALUES (?, ?, ?, ?, ?)`,
      [company, type, id, action, summary],
    );
  } catch (e) {
    console.error("Activity logging failed:", e);
  }
}

export async function selectAll(sqlStr: string, params: any[] = []) {
  return db.query<Record<string, string | number | null>>(sqlStr, params);
}

export async function runInsert(sqlStr: string, params: any[]) {
  return db.run(sqlStr, params);
}

export async function countRows(table: string, company?: string) {
  const where = company ? ' WHERE "company" = ?' : "";
  const params = company ? [company] : [];
  const row = await db.get(`SELECT COUNT(*) as total FROM "${table}"${where}`, params) as { total?: number } | undefined;
  return Number(row?.total ?? 0);
}

export async function syncSprintFromTestPlan({
  company,
  sprintName,
  startDate,
  endDate,
  goal,
}: {
  company: string;
  sprintName?: string;
  startDate?: string;
  endDate?: string;
  goal?: string;
}) {
  if (!sprintName?.trim()) return;
  const status = deriveSprintStatus(startDate, endDate);
  const existing = await db.get(
    `SELECT id FROM "Sprint" WHERE "name" = ? AND "company" = ?`,
    [sprintName, company],
  ) as { id: number } | undefined;

  if (existing) {
    await db.run(
      `UPDATE "Sprint" SET "startDate" = ?, "endDate" = ?, "status" = ?, "goal" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = CAST(? AS INTEGER)`,
      [startDate ?? "", endDate ?? "", status, goal ?? "", existing.id],
    );
  } else {
    await db.run(
      `INSERT INTO "Sprint" ("company", "name", "startDate", "endDate", "status", "goal") VALUES (?, ?, ?, ?, ?, ?)`,
      [company, sprintName, startDate ?? "", endDate ?? "", status, goal ?? ""],
    );
  }
}

export function getRoleRecommendations(role: string, data: any) {
  const r = role.toLowerCase();
  if (r.includes("qa")) {
    return {
      title: "QA Focus",
      items: [
        { label: "Verify Open Bugs", count: data.bugs.length },
        { label: "Pending Test Sessions", count: data.todayActivity.filter((a: any) => a.type === "Session").length },
      ],
    };
  }
  if (r.includes("developer") || r.includes("backend") || r.includes("frontend")) {
    return {
      title: "Development Focus",
      items: [
        { label: "Assigned Bugs to Fix", count: data.bugs.filter((b: any) => b.status === "open" || b.status === "in_progress").length },
        { label: "Ready for Retest", count: data.bugs.filter((b: any) => b.status === "ready_to_retest").length },
      ],
    };
  }
  if (r.includes("manager") || r.includes("analyst")) {
    return {
      title: "Project Health",
      items: [
        { label: "Critical Blockers", count: data.critBugs.length },
        { label: "High Priority Tasks", count: data.prioTasks.length },
      ],
    };
  }
  return null;
}
