import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth-core";
import { codeFromId } from "@/lib/utils";

type CountRow = { count: number | string };
type SeverityRow = { name: string | null; count: number | string };
type ProjectRow = { name: string; count: number | string };
type AssigneeRow = { name: string; taskCount: number | string };

type BugRow = {
  id: number;
  title: string;
  severity: string;
  priority: string;
  project: string;
  status: string;
};

type ClosedBugRow = {
  id: number;
  title: string;
  severity: string;
};

type TaskRow = {
  id: number;
  title: string;
  priority: string;
  status: string;
  project: string;
};

type SessionRow = {
  id: number;
  date: string;
  tester: string;
  scope: string;
  totalCases: number | string;
  passed: number | string;
  failed: number | string;
  blocked: number | string;
  result: string;
};

type SprintRow = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  goal: string;
};

type ActivityRow = {
  entityType: string;
  action: string;
  summary: string;
  createdAt: string;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const andCompany = isAdmin ? "" : ` AND "company" = ?`;
  const cp: unknown[] = isAdmin ? [] : [company];

  const [
    newBugs,
    closedBugs,
    openBugs,
    newTasks,
    doneTasks,
    openTasks,
    sessions,
    testCasesRun,
    bugsBySeverity,
    bugsByProject,
    topAssignees,
    activeSprints,
    recentActivity,
  ] = await Promise.all([
    db.query<BugRow>(
      `SELECT id, title, severity, priority, project, status
       FROM "Bug"
       WHERE DATE("createdAt") >= DATE('now', '-7 days')${andCompany}
       ORDER BY "createdAt" DESC`,
      cp,
    ),
    db.query<ClosedBugRow>(
      `SELECT id, title, severity
       FROM "Bug"
       WHERE status IN ('closed','fixed') AND DATE("updatedAt") >= DATE('now', '-7 days')${andCompany}`,
      cp,
    ),
    db.query<CountRow>(
      `SELECT COUNT(*) as count
       FROM "Bug"
       WHERE status = 'open'${andCompany}`,
      cp,
    ),
    db.query<TaskRow>(
      `SELECT id, title, priority, status, project
       FROM "Task"
       WHERE DATE("createdAt") >= DATE('now', '-7 days')${andCompany}
       ORDER BY "createdAt" DESC`,
      cp,
    ),
    db.query<CountRow>(
      `SELECT COUNT(*) as count
       FROM "Task"
       WHERE status = 'done' AND DATE("updatedAt") >= DATE('now', '-7 days')${andCompany}`,
      cp,
    ),
    db.query<CountRow>(
      `SELECT COUNT(*) as count
       FROM "Task"
       WHERE status != 'done'${andCompany}`,
      cp,
    ),
    db.query<SessionRow>(
      `SELECT id, date, tester, scope, "totalCases", passed, failed, blocked, result
       FROM "TestSession"
       WHERE DATE("createdAt") >= DATE('now', '-7 days')${andCompany}
       ORDER BY date DESC`,
      cp,
    ),
    db.query<CountRow>(
      `SELECT COUNT(*) as count
       FROM "TestCase"
       WHERE DATE("updatedAt") >= DATE('now', '-7 days') AND status != 'Pending'${andCompany}`,
      cp,
    ),
    db.query<SeverityRow>(
      `SELECT COALESCE(NULLIF(severity, ''), 'unknown') as name, COUNT(*) as count
       FROM "Bug"
       WHERE DATE("createdAt") >= DATE('now', '-7 days')${andCompany}
       GROUP BY COALESCE(NULLIF(severity, ''), 'unknown')
       ORDER BY count DESC`,
      cp,
    ),
    db.query<ProjectRow>(
      `SELECT project as name, COUNT(*) as count
       FROM "Bug"
       WHERE DATE("createdAt") >= DATE('now', '-7 days')${andCompany}
       GROUP BY project
       ORDER BY count DESC
       LIMIT 5`,
      cp,
    ),
    db.query<AssigneeRow>(
      `
      SELECT assignee as name, COUNT(*) as taskCount
      FROM "Task"
      WHERE assignee != '' AND DATE("updatedAt") >= DATE('now', '-7 days')${andCompany}
      GROUP BY assignee
      UNION ALL
      SELECT "suggestedDev" as name, COUNT(*) as taskCount
      FROM "Bug"
      WHERE "suggestedDev" != '' AND DATE("updatedAt") >= DATE('now', '-7 days')${andCompany}
      GROUP BY "suggestedDev"
      ORDER BY taskCount DESC
      LIMIT 5
      `,
      [...cp, ...cp],
    ),
    db.query<SprintRow>(
      `SELECT id, name, "startDate", "endDate", status, goal
       FROM "Sprint"
       WHERE status = 'active'${andCompany}
       LIMIT 5`,
      cp,
    ),
    db.query<ActivityRow>(
      `SELECT "entityType", action, summary, "createdAt"
       FROM "ActivityLog"
       WHERE DATE("createdAt") >= DATE('now', '-7 days')${andCompany}
       ORDER BY "createdAt" DESC
       LIMIT 20`,
      cp,
    ),
  ]);

  const totalSessionPassed = sessions.reduce((sum, row) => sum + Number(row.passed ?? 0), 0);
  const totalSessionCases = sessions.reduce((sum, row) => sum + Number(row.totalCases ?? 0), 0);

  return NextResponse.json({
    period: {
      from: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
      to: new Date().toISOString().split("T")[0],
    },
    summary: {
      newBugs: newBugs.length,
      closedBugs: closedBugs.length,
      openBugs: Number(openBugs[0]?.count ?? 0),
      newTasks: newTasks.length,
      doneTasks: Number(doneTasks[0]?.count ?? 0),
      openTasks: Number(openTasks[0]?.count ?? 0),
      sessions: sessions.length,
      testCasesRun: Number(testCasesRun[0]?.count ?? 0),
      passRate: totalSessionCases > 0 ? Math.round((totalSessionPassed / totalSessionCases) * 100) : null,
    },
    newBugs: newBugs.map((bug) => ({
      id: bug.id,
      code: codeFromId("BUG", Number(bug.id)),
      title: bug.title,
      severity: bug.severity,
      priority: bug.priority,
      project: bug.project,
      status: bug.status,
    })),
    closedBugs: closedBugs.map((bug) => ({
      id: bug.id,
      code: codeFromId("BUG", Number(bug.id)),
      title: bug.title,
      severity: bug.severity,
    })),
    newTasks: newTasks.map((task) => ({
      id: task.id,
      code: codeFromId("TASK", Number(task.id)),
      title: task.title,
      priority: task.priority,
      status: task.status,
      project: task.project,
    })),
    bugsBySeverity: bugsBySeverity.map((row) => ({
      name: row.name ?? "unknown",
      count: Number(row.count ?? 0),
    })),
    bugsByProject: bugsByProject.map((row) => ({
      name: row.name,
      count: Number(row.count ?? 0),
    })),
    topAssignees: topAssignees.map((row) => ({
      name: row.name,
      count: Number(row.taskCount ?? 0),
    })),
    activeSprints,
    sessions: sessions.map((session) => ({
      id: session.id,
      date: session.date,
      tester: session.tester,
      scope: session.scope,
      totalCases: Number(session.totalCases ?? 0),
      passed: Number(session.passed ?? 0),
      failed: Number(session.failed ?? 0),
      blocked: Number(session.blocked ?? 0),
      result: session.result,
    })),
    recentActivity: recentActivity.map((activity) => ({
      entityType: activity.entityType,
      action: activity.action,
      summary: activity.summary,
      createdAt: activity.createdAt,
    })),
  });
}
