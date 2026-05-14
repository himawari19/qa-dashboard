import { db, isPostgres } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { moduleConfigs, type ModuleKey } from "@/lib/modules";
import { backfillAssigneesFromUsers, deleteAssigneeForUser, syncAssigneeFromUser } from "@/lib/user-assignee-sync";
import {
  buildSearchClause,
  countRows,
  getAccessScope,
  getTableName,
  getWriteCompany,
  logActivity,
  makePublicToken,
  normalizeTestCaseRow,
  normalizeTestPlanRow,
  normalizeTestSuiteRow,
  runInsert,
  syncSprintFromTestPlan,
} from "@/lib/data-helpers";
import { getQualityTrend, getReleaseNotes } from "@/lib/test-management-data";
import { generateDeploymentNotes } from "@/lib/deployment-notes";
import { getRoleLabel, normalizeRole } from "@/lib/roles";
import { deleteSearchTokens, shouldIndexModule, syncSearchTokens } from "@/lib/search-index";

export {
  makePublicToken,
  normalizeTestCaseRow,
  normalizeTestPlanRow,
  normalizeTestSuiteRow,
  getTableName,
} from "@/lib/data-helpers";

async function selectAll(sqlStr: string, params: any[] = []): Promise<Array<Record<string, string | number | null>>> {
  return db.query<Record<string, string | number | null>>(sqlStr, params);
}

function hydrateDeploymentNotes<T extends Record<string, any>>(row: T) {
  if (!row) return row;
  return {
    ...row,
    notes: generateDeploymentNotes(String(row.changelog ?? "")),
  };
}

async function syncSearchIndex(module: ModuleKey, company: string, entityId: string | number, data: Record<string, unknown>) {
  if (!shouldIndexModule(module)) return;
  await syncSearchTokens(module, company, entityId, data);
}

async function clearSearchIndex(module: ModuleKey, company: string, entityId: string | number) {
  if (!shouldIndexModule(module)) return;
  await deleteSearchTokens(module, company, entityId);
}

type DashboardCacheEntry = { expiresAt: number; data: unknown };
const dashboardCache = new Map<string, DashboardCacheEntry>();
const dashboardProjectsCache = new Map<string, DashboardCacheEntry>();

function dashboardCacheKey(company: string, isAdmin: boolean, role: string, projectFilter: string) {
  return [company, isAdmin ? "admin" : "user", role, projectFilter || "__all__"].join("|");
}

export function invalidateDashboardCache(company?: string) {
  if (!company) {
    dashboardCache.clear();
    dashboardProjectsCache.clear();
    return;
  }
  const prefix = `${company}|`;
  for (const key of dashboardCache.keys()) {
    if (key.startsWith(prefix)) dashboardCache.delete(key);
  }
  for (const key of dashboardProjectsCache.keys()) {
    if (key.startsWith(prefix)) dashboardProjectsCache.delete(key);
  }
}

export async function getDashboardProjects() {
  const user = await getCurrentUser();
  if (!user) return [] as string[];

  const { company, isAdmin } = getAccessScope(user);
  const cacheKey = `${company}|${isAdmin ? "admin" : "user"}`;
  const cached = dashboardProjectsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return structuredClone(cached.data as string[]);
  }

  const andCompany = isAdmin ? "" : ` AND "company" = ?`;
  const cp = isAdmin ? [] : [company];
  const rows = await db.query(
    `SELECT DISTINCT project FROM "TestPlan" WHERE COALESCE(project, '') != '' AND "deletedAt" IS NULL${andCompany}
     UNION
     SELECT DISTINCT project FROM "Bug" WHERE COALESCE(project, '') != ''${andCompany}
     UNION
     SELECT DISTINCT project FROM "Task" WHERE COALESCE(project, '') != ''${andCompany}
     ORDER BY project ASC`,
    [...cp, ...cp, ...cp],
  ) as Array<{ project: string }>;

  const projects = rows.map((row) => String(row.project));
  dashboardProjectsCache.set(cacheKey, { data: projects, expiresAt: Date.now() + 60000 });
  return projects;
}

export async function getProjectOptions() {
  const { company, isAdmin } = getAccessScope(await getCurrentUser());
  const rows = await selectAll(
    `SELECT DISTINCT "project" as value FROM "TestPlan"
     WHERE COALESCE("project", '') != '' AND "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}
     ORDER BY "project" ASC`,
    isAdmin ? [] : [company],
  );
  return rows.map((row) => ({ value: String(row.value ?? ""), label: String(row.value ?? "") }));
}

export async function getBacklogOptions() {
  const { company, isAdmin } = getAccessScope(await getCurrentUser());
  const rows = await selectAll(
    `SELECT id, title, "project"
     FROM "TestPlan"
     WHERE COALESCE(title, '') != '' AND "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}
     ORDER BY "updatedAt" DESC`,
    isAdmin ? [] : [company],
  );
  return rows.map((row) => ({
    value: String(row.title ?? ""),
    label: row.project ? `${String(row.title ?? "")} (${String(row.project ?? "")})` : String(row.title ?? ""),
  }));
}

export async function getAssigneeOptions() {
  const { company, isAdmin } = getAccessScope(await getCurrentUser());
  const rows = await selectAll(
    `SELECT DISTINCT COALESCE("name", "email") as value, "role"
     FROM "User"
     WHERE (COALESCE("name", '') != '' OR COALESCE("email", '') != '') AND "deletedAt" IS NULL
     ${isAdmin ? "" : ' AND "company" = ?'}
     ORDER BY COALESCE("name", "email") ASC`,
    isAdmin ? [] : [company],
  );
  return rows
    .filter((row) => normalizeRole(String(row.role ?? "")) !== "admin")
    .map((row) => {
      const name = String(row.value ?? "").trim();
      const role = normalizeRole(String(row.role ?? "").trim());
      return {
        value: name,
        label: role ? `${name} (${getRoleLabel(role)})` : name,
        role,
      };
    })
    .filter((row) => Boolean(row.value));
}

export async function getTestPlanReferenceRows() {
  const { company, isAdmin, andWhere, params: qParams } = getAccessScope(await getCurrentUser());
  const rows = await selectAll(
    `SELECT "id", "title", "project", "publicToken", "sprint", "updatedAt"
     FROM "TestPlan"
     WHERE "deletedAt" IS NULL ${andWhere}
     ORDER BY "updatedAt" DESC`,
    qParams,
  );
  return rows.map((item) => ({
    id: String(item.id ?? ""),
    title: String(item.title ?? ""),
    project: String(item.project ?? ""),
    publicToken: String(item.publicToken ?? ""),
    sprint: String(item.sprint ?? ""),
  }));
}

export async function getTestSuitesByPlanIds(planIds: Array<string | number>) {
  const ids = planIds.map((id) => String(id)).filter(Boolean);
  if (ids.length === 0) return [];
  const { company, isAdmin } = getAccessScope(await getCurrentUser());
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await selectAll(
    `SELECT id, "testPlanId", title, "publicToken"
     FROM "TestSuite"
     WHERE "deletedAt" IS NULL
     ${isAdmin ? "" : ' AND "company" = ?'}
     AND "testPlanId" IN (${ids.map(() => "CAST(? AS TEXT)").join(", ")})
     ORDER BY "updatedAt" DESC`,
    isAdmin ? ids : [company, ...ids],
  );
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    testPlanId: String(row.testPlanId ?? ""),
    title: String(row.title ?? ""),
    token: String(row.publicToken ?? ""),
  }));
}

export async function getTestCaseStatsBySuiteIds(suiteIds: Array<string | number>) {
  const ids = suiteIds.map((id) => String(id)).filter(Boolean);
  if (ids.length === 0) return new Map<string, { passed: number; failed: number; total: number }>();
  const { company, isAdmin } = getAccessScope(await getCurrentUser());
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await selectAll(
    `SELECT tc."testSuiteId" as suiteId,
      COUNT(*) as total,
      SUM(CASE WHEN LOWER(COALESCE(tc."status", '')) = 'passed' THEN 1 ELSE 0 END) as passed,
      SUM(CASE WHEN LOWER(COALESCE(tc."status", '')) = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN LOWER(COALESCE(tc."status", '')) = 'blocked' THEN 1 ELSE 0 END) as blocked
     FROM "TestCase" tc
     WHERE tc."deletedAt" IS NULL
     ${isAdmin ? "" : ' AND tc."company" = ?'}
     AND tc."testSuiteId" IN (${ids.map(() => "CAST(? AS TEXT)").join(", ")})
     GROUP BY tc."testSuiteId"`,
    isAdmin ? ids : [company, ...ids],
  );
  const stats = new Map<string, { passed: number; failed: number; total: number }>();
  for (const row of rows) {
    const key = String(row.suiteId ?? "");
    if (!key) continue;
    stats.set(key, {
      passed: Number(row.passed ?? 0),
      failed: Number(row.failed ?? 0),
      total: Number(row.total ?? 0),
    });
  }
  return stats;
}

export async function getDashboardData(filterProject?: string): Promise<any> {
  const user = await getCurrentUser();
  const { company, isAdmin } = getAccessScope(user);
  const userRole = user?.role || "user";
  const rolePersona = userRole;
  const normalizedProject = String(filterProject ?? "").trim();
  const cacheKey = dashboardCacheKey(company, isAdmin, userRole, filterProject || "");
  const cached = dashboardCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return structuredClone(cached.data as object);
  }

  const companyWhere = isAdmin ? "" : `WHERE "company" = ?`;
  const companyAndWhere = isAdmin ? "" : `AND "company" = ?`;
  const companyParams = isAdmin ? [] : [company];
  const projectWhere = normalizedProject
    ? (isAdmin ? ` WHERE "project" = ?` : ` WHERE "company" = ? AND "project" = ?`)
    : companyWhere;
  const projectAndWhere = normalizedProject
    ? (isAdmin ? ` AND "project" = ?` : ` AND "company" = ? AND "project" = ?`)
    : companyAndWhere;
  const projectParams = normalizedProject
    ? (isAdmin ? [normalizedProject] : [company, normalizedProject])
    : companyParams;

  const [
    tasks, 
    bugs, 
    testCases, 
    summaryCounts,
    taskStatus,
    bugSeverity,
    sprint,
    completionCounts,
    bugTrend,
    allSprints,
    activity,
    bugByModule,
    todayTasks,
    todayBugs,
    todaySessions,
    critBugs,
    prioTasks,
    suiteAndSessionCounts,
    recentSessions,
    heatmapRes
  ] = await Promise.all([
    selectAll(`SELECT "id", "title", "priority", "status" FROM "Task" ${projectWhere} ORDER BY COALESCE("sortOrder", 0) ASC, "updatedAt" DESC LIMIT 5`, projectParams),
    selectAll(`SELECT "id", "title", "severity", "priority", "status" FROM "Bug" ${projectWhere} ORDER BY COALESCE("sortOrder", 0) ASC, "updatedAt" DESC LIMIT 5`, projectParams),
    selectAll(`SELECT "id", "caseName", "priority", "status" FROM "TestCase" ${companyWhere}${isAdmin ? "" : ' AND "deletedAt" IS NULL'} ORDER BY COALESCE("sortOrder", 0) ASC, "updatedAt" DESC LIMIT 5`, companyParams),
    db.get(
      `SELECT
         (SELECT COUNT(*) FROM "Task" ${projectWhere}) AS taskCount,
         (SELECT COUNT(*) FROM "Bug" ${projectWhere}) AS bugCount,
         (SELECT COUNT(*) FROM "TestCase" ${companyWhere}${isAdmin ? "" : ' AND "deletedAt" IS NULL'}) AS caseCount
       `,
      [...projectParams, ...projectParams, ...companyParams],
    ) as Promise<any>,
    selectAll(`SELECT status, COUNT(*) as count FROM "Task" ${projectWhere} GROUP BY status`, projectParams),
    selectAll(`SELECT severity, COUNT(*) as count FROM "Bug" ${projectWhere} GROUP BY severity`, projectParams),
    db.get(`SELECT "id", "name", "startDate", "endDate", "status" FROM "Sprint" WHERE status = 'active' ${companyAndWhere} LIMIT 1`, companyParams) as Promise<any>,
    db.get(
      `SELECT
         (SELECT COUNT(*) FROM "Bug" WHERE status IN ('fixed', 'closed') ${projectAndWhere}) AS bugFixedCount,
         (SELECT COUNT(*) FROM "Task" WHERE status = 'completed' ${projectAndWhere}) AS taskCompletedCount
       `,
      [...projectParams, ...projectParams],
    ) as Promise<any>,
    selectAll(`SELECT DATE("createdAt") as date, COUNT(*) as count FROM "Bug" WHERE "createdAt" >= DATE('now', '-7 days') ${projectAndWhere} GROUP BY DATE("createdAt") ORDER BY date ASC`, projectParams),
    selectAll(`SELECT id, name, "startDate", "endDate", status FROM "Sprint" ${companyWhere} ORDER BY "startDate" DESC LIMIT 20`, companyParams),
    selectAll(`SELECT "id", "entityType", "entityId", "action", "summary", "createdAt" FROM "ActivityLog" ${companyWhere} ORDER BY "createdAt" DESC LIMIT 10`, companyParams),
    selectAll(`SELECT module, COUNT(*) as count FROM "Bug" ${projectWhere} GROUP BY module LIMIT 10`, projectParams),
    selectAll(`SELECT 'Task' as type, title as label, status FROM "Task" WHERE DATE("updatedAt") = DATE('now') ${projectAndWhere}`, projectParams),
    selectAll(`SELECT 'Bug' as type, title as label, status FROM "Bug" WHERE DATE("updatedAt") = DATE('now') ${projectAndWhere}`, projectParams),
    selectAll(`SELECT 'Session' as type, scope as label, result FROM "TestSession" WHERE DATE("createdAt") = DATE('now') ${projectAndWhere}`, projectParams),
    selectAll(`SELECT "id", "title", "severity" FROM "Bug" WHERE "severity" IN ('critical', 'high', 'P0', 'P1') AND "status" != 'closed' ${projectAndWhere} ORDER BY "createdAt" DESC`, projectParams),
    selectAll(`SELECT "id", "title", "priority" FROM "Task" WHERE "priority" IN ('High', 'Urgent', 'P0', 'P1') AND "status" != 'done' ${projectAndWhere} ORDER BY "createdAt" DESC`, projectParams),
    db.get(
      `SELECT
         (SELECT COUNT(*) FROM "TestSuite" ${companyWhere}${isAdmin ? "" : ' AND "deletedAt" IS NULL'}) AS suiteCount,
         (SELECT COUNT(*) FROM "TestSession" ${companyWhere}${isAdmin ? "" : ' AND "deletedAt" IS NULL'}) AS sessionCount
       `,
      [...companyParams, ...companyParams],
    ) as Promise<any>,
    selectAll(`SELECT id, date, tester, scope, "totalCases", passed, failed, blocked, result FROM "TestSession" ${projectWhere} ORDER BY date DESC LIMIT 10`, projectParams),
    selectAll(`
      WITH
        TaskCounts AS (
          SELECT assignee as name, COUNT(*) as cnt FROM "Task"
          WHERE status != 'done' AND assignee != '' ${projectAndWhere} GROUP BY assignee
        ),
        BugCounts AS (
          SELECT "suggestedDev" as name, COUNT(*) as cnt FROM "Bug"
          WHERE status != 'closed' AND "suggestedDev" != '' ${projectAndWhere} GROUP BY "suggestedDev"
        ),
        SuiteCounts AS (
          SELECT assignee as name, COUNT(*) as cnt FROM "TestSuite"
          WHERE status != 'archived' AND assignee != '' ${companyAndWhere} GROUP BY assignee
        ),
        PlanCounts AS (
          SELECT assignee as name, COUNT(*) as cnt FROM "TestPlan"
          WHERE status != 'closed' AND assignee != '' ${projectAndWhere} GROUP BY assignee
        ),
        AllAssignees AS (
          SELECT assignee as name FROM "Task" WHERE assignee != '' AND status != 'done' ${projectAndWhere}
          UNION
          SELECT "suggestedDev" as name FROM "Bug" WHERE "suggestedDev" != '' AND status != 'closed' ${projectAndWhere}
          UNION
          SELECT assignee as name FROM "TestSuite" WHERE assignee != '' AND status != 'archived' ${companyAndWhere}
          UNION
          SELECT assignee as name FROM "TestPlan" WHERE assignee != '' AND status != 'closed' ${projectAndWhere}
          UNION
          SELECT COALESCE("name", "email") as name FROM "User" ${companyWhere}
        )
      SELECT
        a.name,
        COALESCE(t.cnt, 0) as taskCount,
        COALESCE(b.cnt, 0) as bugCount,
        COALESCE(s.cnt, 0) as suiteCount,
        COALESCE(p.cnt, 0) as planCount
      FROM AllAssignees a
      LEFT JOIN TaskCounts t ON a.name = t.name
      LEFT JOIN BugCounts b ON a.name = b.name
      LEFT JOIN SuiteCounts s ON a.name = s.name
      LEFT JOIN PlanCounts p ON a.name = p.name
      WHERE a.name IS NOT NULL AND a.name != ''
      ORDER BY a.name ASC
    `, [...projectParams, ...projectParams, ...companyParams, ...projectParams, ...projectParams, ...projectParams, ...companyParams, ...projectParams, ...companyParams]),
  ]);

  let taskCount = Number(summaryCounts?.taskCount ?? 0);
  let bugCount = Number(summaryCounts?.bugCount ?? 0);
  let caseCount = Number(summaryCounts?.caseCount ?? 0);
  let suiteCount = Number(suiteAndSessionCounts?.suiteCount ?? 0);
  let sessionCount = Number(suiteAndSessionCounts?.sessionCount ?? 0);
  let bugFixed = { count: Number(completionCounts?.bugFixedCount ?? 0) };
  let taskCompleted = { count: Number(completionCounts?.taskCompletedCount ?? 0) };
  if (!summaryCounts) {
    [taskCount, bugCount, caseCount] = await Promise.all([
      countRows("Task", company),
      countRows("Bug", company),
      countRows("TestCase", company),
    ]);
  }
  if (!suiteAndSessionCounts) {
    [suiteCount, sessionCount] = await Promise.all([
      countRows("TestSuite", company),
      countRows("TestSession", company),
    ]);
  }
  if (!completionCounts) {
    const [bugFixedCount, taskCompletedCount] = await Promise.all([
      db.get(`SELECT COUNT(*) as count FROM "Bug" WHERE status IN ('fixed', 'closed') ${projectAndWhere}`, projectParams) as Promise<any>,
      db.get(`SELECT COUNT(*) as count FROM "Task" WHERE status = 'completed' ${projectAndWhere}`, projectParams) as Promise<any>,
    ]);
    bugFixed = { count: Number(bugFixedCount?.count ?? 0) };
    taskCompleted = { count: Number(taskCompletedCount?.count ?? 0) };
  }

  const todayActivity = [...(todayTasks || []), ...(todayBugs || []), ...(todaySessions || [])];

  let sprintInfo = null;
  let sprintBurndown: { date: string; done: number; ideal: number }[] = [];
  if (sprint) {
    const [tTotal, tDone, burndownRows] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM "Task" WHERE "sprintId" = ?' + companyAndWhere, [sprint.id, ...companyParams]) as Promise<any>,
      db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE \"sprintId\" = ? AND status = 'done'" + companyAndWhere, [sprint.id, ...companyParams]) as Promise<any>,
      selectAll(
        `SELECT DATE("updatedAt") as date, COUNT(*) as count FROM "Task"
         WHERE "sprintId" = ? AND status = 'done'
         AND DATE("updatedAt") BETWEEN ? AND ?
         ${companyAndWhere} GROUP BY DATE("updatedAt") ORDER BY date ASC`,
        [sprint.id, sprint.startDate, sprint.endDate, ...companyParams]
      ),
    ]);

    sprintInfo = {
      name: String(sprint.name),
      startDate: String(sprint.startDate),
      endDate: String(sprint.endDate),
      progress: Number(tTotal.count) > 0 ? Math.round((Number(tDone.count) / Number(tTotal.count)) * 100) : 0,
      taskTotal: Number(tTotal.count),
      taskDone: Number(tDone.count)
    };

    // Build cumulative burndown with ideal line
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
    const totalTasks = Number(tTotal.count);
    const doneByDate: Record<string, number> = {};
    for (const row of burndownRows as any[]) {
      doneByDate[String(row.date)] = Number(row.count);
    }
    let cumDone = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      if (dateStr > today) break;
      cumDone += doneByDate[dateStr] || 0;
      sprintBurndown.push({
        date: dateStr.slice(5),
        done: cumDone,
        ideal: Math.round((i / totalDays) * totalTasks),
      });
    }
  }

  // Pass rate per sprint (last 5 sprints)
  const sprintJoinClause = normalizedProject
    ? (isAdmin
      ? ' AND ts."project" = ?'
      : ' AND ts."company" = ? AND ts."project" = ?')
    : (isAdmin ? "" : ' AND ts."company" = ?');
  const sprintJoinParams = normalizedProject
    ? (isAdmin ? [normalizedProject] : [company, normalizedProject])
    : (isAdmin ? [] : [company]);
  const sprintWhereClause = isAdmin
    ? 'WHERE sp."deletedAt" IS NULL'
    : 'WHERE sp."company" = ? AND sp."deletedAt" IS NULL';
  const sprintWhereParams = isAdmin ? [] : [company];
  const sprintPassRateRows = await selectAll(
    `SELECT sp.id, sp.name, sp."startDate", sp."endDate",
            COALESCE(SUM(COALESCE(ts.passed, 0)), 0) AS passed,
            COALESCE(SUM(COALESCE(ts."totalCases", 0)), 0) AS totalCases,
            COUNT(ts.id) AS sessions
     FROM "Sprint" sp
     LEFT JOIN "TestSession" ts
       ON COALESCE(ts."date", '') != ''
      AND ts."date" BETWEEN sp."startDate" AND sp."endDate"
      ${sprintJoinClause}
     ${sprintWhereClause}
     GROUP BY sp.id, sp.name, sp."startDate", sp."endDate"
     ORDER BY sp."startDate" DESC
     LIMIT 5`,
    [...sprintJoinParams, ...sprintWhereParams],
  ) as any[];
  const sprintPassRates = sprintPassRateRows.map((sp: any) => {
    const totalPassed = Number(sp.passed ?? 0);
    const totalCases = Number(sp.totalCases ?? 0);
    return {
      name: String(sp.name).replace(/sprint\s*/i, "S").substring(0, 12),
      passRate: totalCases > 0 ? Math.round(totalPassed * 100 / totalCases) : 0,
      sessions: Number(sp.sessions ?? 0),
    };
  });

  const successRate = (bugCount + taskCount) > 0 ? Math.round(((Number(bugFixed.count) + Number(taskCompleted.count)) / (bugCount + taskCount)) * 100) : 0;
  
  // Dynamic spotlight project
  const mostActiveProject = await db.get(`SELECT project as name FROM "TestPlan" ${companyWhere} GROUP BY project ORDER BY COUNT(*) DESC LIMIT 1`, companyParams) as any;
  const spotlightName = mostActiveProject?.name || (taskCount > 0 || bugCount > 0 ? "Active Project" : "No active project");

  const data = {
    metrics: [
      { label: "Open Tasks", value: taskCount, caption: "Daily QA tasks currently being managed." },
      { label: "Bug Entries", value: bugCount, caption: "Defects with severity, priority, and evidence." },
      { label: "Test Cases", value: caseCount, caption: "Positive and negative scenarios ready for use." },
      { label: "Test Suites", value: suiteCount, caption: "Organized collections of test scenarios." },
      { label: "Sessions", value: sessionCount, caption: "Test execution sessions recorded." },
    ],
    recentSessions: (recentSessions || []).map((s: any) => ({
      id: Number(s.id),
      date: String(s.date ?? ""),
      tester: String(s.tester ?? ""),
      scope: String(s.scope ?? ""),
      totalCases: Number(s.totalCases ?? 0),
      passed: Number(s.passed ?? 0),
      failed: Number(s.failed ?? 0),
      blocked: Number(s.blocked ?? 0),
      result: String(s.result ?? ""),
    })),
    rolePersona,
    distribution: {
      tasks: taskStatus.map(r => ({ name: String(r.status), value: Number(r.count) })),
      bugs: bugSeverity.map(r => ({ name: String(r.severity), value: Number(r.count) })),
      bugByModule: bugByModule.map(r => ({ module: String(r.module), count: Number(r.count) })),
    },
    todayActivity: todayActivity.map(r => ({ type: String(r.type), label: String(r.label), status: String(r.status) })),
    recent: {
      tasks: tasks.map((item) => ({
        id: Number(item.id),
        code: codeFromId("TASK", Number(item.id)),
        title: String(item.title ?? ""),
        priority: String(item.priority ?? ""),
        status: String(item.status ?? ""),
      })),
      bugs: bugs.map((item) => ({
        id: Number(item.id),
        code: codeFromId("BUG", Number(item.id)),
        title: String(item.title ?? ""),
        severity: String(item.severity ?? ""),
        priority: String(item.priority ?? ""),
        status: String(item.status ?? ""),
      })),
      testCases: testCases.map((item) => ({
        id: Number(item.id),
        code: codeFromId("TC", Number(item.id)),
        title: String(item.caseName ?? ""),
        priority: String(item.priority ?? "Medium"),
        status: String(item.status ?? "Pending"),
      })),
    },
    spotlight: {
       projectName: spotlightName,
       projectDescription: "Track and monitor QA progress across modules.",
       totalScenarios: caseCount,
       totalBugs: bugCount,
       completionRate: successRate,
       criticalBugs: (critBugs || []).map((b: any) => ({ 
         id: b.id,
         title: String(b.title), 
         severity: String(b.severity),
         code: codeFromId("BUG", Number(b.id))
       })),
       priorityTasks: (prioTasks || []).map((t: any) => ({ 
         id: t.id,
         title: String(t.title), 
         priority: String(t.priority),
         code: codeFromId("TASK", Number(t.id))
       }))
    },
    sprintInfo: sprintInfo ? {
       ...sprintInfo,
       goal: "Complete all planned tasks for the current cycle."
    } : null,
    personalSuccessRate: successRate,
    heatmap: (heatmapRes || []).map((r: any) => ({
      name: String(r.name),
      taskCount: Number(r.taskCount),
      bugCount: Number(r.bugCount),
      suiteCount: Number(r.suiteCount),
      planCount: Number(r.planCount),
      total: Number(r.taskCount) + Number(r.bugCount) + Number(r.suiteCount) + Number(r.planCount)
    })),
    activity: (activity as Array<Record<string, unknown>>).map((item) => ({
      id: Number(item.id),
      entityType: String(item.entityType ?? ""),
      entityId: String(item.entityId ?? ""),
      action: String(item.action ?? ""),
      summary: String(item.summary ?? ""),
      createdAt: String(item.createdAt ?? ""),
    })),
    bugTrendData: bugTrend.map((r) => ({ date: String(r.date), count: Number(r.count) })),
    sprintBurndown,
    sprintPassRates: sprintPassRates.reverse(),
    sprints: allSprints.map((s) => ({
      id: Number(s.id),
      name: String(s.name),
      startDate: String(s.startDate),
      endDate: String(s.endDate),
      status: String(s.status),
    })),
  };
  dashboardCache.set(cacheKey, { data, expiresAt: Date.now() + 15000 });
  return structuredClone(data as object);
}

export async function getReportsData() {
  const { company, isAdmin } = getAccessScope(await getCurrentUser());
  const andWhere = isAdmin ? "" : ' WHERE "company" = ?';
  const andWhereAnd = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

  const [bugSeverity, bugStatus, testCaseStatus, bugTrend] = await Promise.all([
    selectAll(`SELECT "severity" as name, COUNT(*) as value FROM "Bug"${andWhere} GROUP BY "severity"`, qParams),
    selectAll(`SELECT "status" as name, COUNT(*) as value FROM "Bug"${andWhere} GROUP BY "status"`, qParams),
    selectAll(`SELECT "status" as name, COUNT(*) as value FROM "TestCase"${andWhere} GROUP BY "status"`, qParams),
    selectAll(`SELECT DATE("createdAt") as date, COUNT(*) as count FROM "Bug"${andWhere} GROUP BY DATE("createdAt") ORDER BY date ASC`, qParams),
  ]);

  return {
    bugSeverityData: bugSeverity.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    bugStatusData: bugStatus.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    testCaseStatusData: testCaseStatus.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    bugTrendData: bugTrend.map((row) => ({ date: String(row.date), count: Number(row.count) })),
  };
}


export async function getResourceDetails(name: string) {
  const { company, isAdmin } = getAccessScope(await getCurrentUser());
  const resourceCacheKey = `${company}|${isAdmin ? "admin" : "user"}|${name.toLowerCase()}`;
  const resourceCache = (globalThis as typeof globalThis & {
    __qaResourceDetailsCache?: Map<string, { expiresAt: number; data: unknown }>;
  }).__qaResourceDetailsCache ?? ((globalThis as typeof globalThis & {
    __qaResourceDetailsCache?: Map<string, { expiresAt: number; data: unknown }>;
  }).__qaResourceDetailsCache = new Map());
  const cached = resourceCache.get(resourceCacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return structuredClone(cached.data as object);
  }
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const companyParam = isAdmin ? [] : [company];

  const [tasks, bugs, suites] = await Promise.all([
    selectAll(`SELECT id, title, status, priority FROM "Task" WHERE assignee = ? ${andWhere} AND status != 'done' ORDER BY "createdAt" DESC`, [name, ...companyParam]),
    selectAll(`SELECT id, title, status, severity as priority FROM "Bug" WHERE "suggestedDev" = ? ${andWhere} AND status NOT IN ('closed', 'rejected') ORDER BY "createdAt" DESC`, [name, ...companyParam]),
    selectAll(`SELECT id, title, status, 'N/A' as priority FROM "TestSuite" WHERE assignee = ? ${andWhere} AND status != 'archived' ORDER BY "createdAt" DESC`, [name, ...companyParam]),
  ]);

  const data = {
    tasks: tasks.map(t => ({ ...t, type: 'Task' })),
    bugs: bugs.map(b => ({ ...b, type: 'Bug' })),
    suites: suites.map(s => ({ ...s, type: 'Suite' })),
  };
  resourceCache.set(resourceCacheKey, { data, expiresAt: Date.now() + 30000 });
  return structuredClone(data as object);
}

export async function getExecutiveData() {
  const { company, isAdmin } = getAccessScope(await getCurrentUser());
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const whereClause = isAdmin ? "" : ' WHERE "company" = ?';
  const qp = isAdmin ? [] : [company];

  const [critRes, totalBugs, openT, tcPass, testCaseTotal] = await Promise.all([
    db.get(`SELECT COUNT(*) as count FROM "Bug" WHERE "severity" IN ('critical', 'high', 'P0', 'P1') AND "status" != 'closed'${andWhere}`, qp) as Promise<any>,
    countRows("Bug", isAdmin ? undefined : company),
    db.get(`SELECT COUNT(*) as count FROM "Task" WHERE "status" != 'done'${andWhere}`, qp) as Promise<any>,
    db.get(`SELECT COUNT(*) as count FROM "TestCase" WHERE "status" IN ('Passed', 'Success')${andWhere}`, qp) as Promise<any>,
    countRows("TestCase", isAdmin ? undefined : company),
  ]);

  const criticalBugs = Number(critRes.count);
  const openTasks = Number(openT.count);
  const testCasePass = Number(tcPass.count);
  
  const readiness = testCaseTotal > 0 ? Math.round((testCasePass / testCaseTotal) * 100) : 0;
  const bugDensity = totalBugs > 0 ? parseFloat((criticalBugs / totalBugs).toFixed(2)) : 0;

  const metrics = [
    { label: "Critical Defects", value: criticalBugs, trend: "down", status: criticalBugs > 5 ? "danger" : "warning" },
    { label: "Release Readiness", value: readiness + "%", trend: "up", status: readiness > 90 ? "success" : "warning" },
    { label: "Risk Factor", value: bugDensity, trend: "stable", status: Number(bugDensity) > 0.2 ? "danger" : "success" },
    { label: "Blockers", value: openTasks, trend: "down", status: openTasks > 10 ? "warning" : "success" },
  ];

  const [trend, notes, totalTasks, fBugs, cTasks] = await Promise.all([
    getQualityTrend(),
    getReleaseNotes(),
    countRows("Task", isAdmin ? undefined : company),
    db.get(`SELECT COUNT(*) as count FROM "Bug" WHERE "status" IN ('fixed', 'closed')${andWhere}`, qp) as Promise<any>,
    db.get(`SELECT COUNT(*) as count FROM "Task" WHERE "status" = 'completed'${andWhere}`, qp) as Promise<any>
  ]);

  const fixedBugs = Number(fBugs.count);
  const completedTasks = Number(cTasks.count);
  const totalActions = totalBugs + totalTasks;
  const totalSuccess = fixedBugs + completedTasks;
  const personalSuccessRate = totalActions > 0 ? Math.round((totalSuccess / totalActions) * 100) : 100;

  const isHealthy = (readiness >= 80 || testCaseTotal === 0) && criticalBugs === 0;
  const hasData = totalBugs > 0 || totalTasks > 0 || testCaseTotal > 0;

  return {
    metrics,
    trend,
    releaseNotes: notes,
    personalSuccessRate,
    summary: {
      health: !hasData ? "N/A" : (isHealthy ? "Healthy" : "Needs Attention"),
      message: !hasData 
        ? "No data recorded yet. Start by adding tasks or test cases to see the health assessment."
        : (isHealthy 
           ? "The project is currently in a stable state with a high pass rate." 
           : "Action required: Several high-severity defects are pending or pass rate is low."),
      planName: (await db.get(`SELECT "title" FROM "TestPlan" WHERE "deletedAt" IS NULL${andWhere} ORDER BY "updatedAt" DESC LIMIT 1`, qp) as any)?.title || "Master Test Strategy",
      projectName: (await db.get(`SELECT "project" FROM "TestPlan" WHERE "deletedAt" IS NULL${andWhere} ORDER BY "updatedAt" DESC LIMIT 1`, qp) as any)?.project || "All Active Projects"
    }
  };
}

export async function getModuleRows(module: ModuleKey) {
  const scope = getAccessScope(await getCurrentUser());
  const { company, isAdmin, where, andWhere, params: qParams } = scope;

  switch (module) {
    case "test-plans":
      return (await selectAll(`SELECT "id", "company", "publicToken", "title", "project", "sprint", "scope", "status", "startDate", "endDate", "notes", "assignee", "createdAt", "updatedAt", "deletedAt" FROM "TestPlan" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "updatedAt" DESC`, qParams)).map((item) => {
        const normalized = normalizeTestPlanRow(item);
        return {
          ...normalized,
          code: codeFromId("PLAN", Number(item.id)),
          publicToken: normalized.publicToken || "",
        };
      });
    case "test-sessions":
      return await selectAll(`SELECT "id", "company", "project", "date", "tester", "scope", "totalCases", "passed", "failed", "blocked", "result", "notes", "createdAt", "updatedAt", "deletedAt" FROM "TestSession" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "updatedAt" DESC`, qParams);
    case "test-cases":
      return (await selectAll(`SELECT "id", "company", "publicToken", "testSuiteId", "tcId", "typeCase", "preCondition", "caseName", "assignee", "testStep", "expectedResult", "actualResult", "status", "evidence", "priority", "createdAt", "updatedAt", "deletedAt" FROM "TestCase" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "updatedAt" DESC`, qParams)).map((item) => normalizeTestCaseRow(item));
    case "bugs":
      return await selectAll(`SELECT "id", "company", "project", "module", "bugType", "title", "preconditions", "stepsToReproduce", "expectedResult", "actualResult", "severity", "priority", "status", "evidence", "relatedItems", "suggestedDev", "createdAt", "updatedAt", "deletedAt" FROM "Bug" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "updatedAt" DESC`, qParams);
    case "tasks":
      return await selectAll(`SELECT "id", "company", "title", "project", "relatedFeature", "category", "status", "priority", "dueDate" AS "startDate", "dueDate" AS "endDate", "description", "acceptanceCriteria", "assignee", "evidence", "createdAt", "updatedAt", "deletedAt" FROM "Task" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "updatedAt" DESC`, qParams);
    case "test-suites": {
      const suiteCompanyWhere = isAdmin ? "" : ' AND ts."company" = ?';
      return (await selectAll(
        `WITH case_stats AS (
          SELECT tc."testSuiteId" as suiteId,
            SUM(CASE WHEN LOWER(COALESCE(tc."status", '')) = 'passed' THEN 1 ELSE 0 END) as passed,
            SUM(CASE WHEN LOWER(COALESCE(tc."status", '')) = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN LOWER(COALESCE(tc."status", '')) = 'blocked' THEN 1 ELSE 0 END) as blocked
          FROM "TestCase" tc
          WHERE tc."deletedAt" IS NULL${isAdmin ? "" : ' AND tc."company" = ?'}
          GROUP BY tc."testSuiteId"
        )
        SELECT ts.*, COALESCE(cs.passed, 0) as passed, COALESCE(cs.failed, 0) as failed, COALESCE(cs.blocked, 0) as blocked
         FROM "TestSuite" ts
          LEFT JOIN case_stats cs ON CAST(cs.suiteId AS INTEGER) = ts.id
         WHERE ts."deletedAt" IS NULL${suiteCompanyWhere} ORDER BY ts."updatedAt" DESC`,
        isAdmin ? [] : [company, company]
      )).map((item) => ({
        ...normalizeTestSuiteRow(item),
        code: codeFromId("SUITE", Number(item.id)),
        passed: Number(item.passed ?? 0),
        failed: Number(item.failed ?? 0),
        blocked: Number(item.blocked ?? 0),
      }));
    }
    case "assignees":
      await backfillAssigneesFromUsers();
      await db.exec(`CREATE TABLE IF NOT EXISTS "Assignee" (
        "id" ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
        "company" TEXT NOT NULL DEFAULT '',
        "userId" INTEGER UNIQUE,
        "name" TEXT NOT NULL,
        "role" TEXT,
        "email" TEXT,
        "skills" TEXT DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" ${isPostgres ? "TIMESTAMP" : "TEXT"} NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" ${isPostgres ? "TIMESTAMP" : "TEXT"} NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
      const assigneeRows = await selectAll(`SELECT u."id", u."name", u."role", u."email", COALESCE(a."skills", '') as "skills", 'active' as "status"
        FROM "User" u
        LEFT JOIN "Assignee" a ON a."userId" = u."id"
        WHERE u."deletedAt" IS NULL${isAdmin ? "" : ' AND u."company" = ?'}
        ORDER BY u."name" ASC`, qParams);
      return assigneeRows
        .filter((item: any) => normalizeRole(String(item.role ?? "")) !== "admin")
        .map((item: any) => ({
          ...item,
          id: String(item.id),
        }));
    case "meeting-notes":
      // Emergency check to ensure table exists (fixes "no such table" errors)
      await db.exec(`CREATE TABLE IF NOT EXISTS "MeetingNote" (
        "id" ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
        "company" TEXT NOT NULL DEFAULT '',
        "publicToken" TEXT NOT NULL DEFAULT '',
        "date" ${isPostgres ? "TIMESTAMP" : "TEXT"} NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "project" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "deletedAt" ${isPostgres ? "TIMESTAMP" : "TEXT"},
        "createdAt" ${isPostgres ? "TIMESTAMP" : "TEXT"} NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" ${isPostgres ? "TIMESTAMP" : "TEXT"} NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
      return (await selectAll(`SELECT "id", "company", "title", "date", "project", "relatedItems", "summary", "actionItems", "status", "publicToken", "createdAt", "updatedAt", "deletedAt" FROM "MeetingNote" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "date" DESC, "updatedAt" DESC`, qParams)).map((item) => ({
        ...item,
        code: codeFromId("MEET", Number(item.id)),
      }));
    case "users":
      return await selectAll(`SELECT id, name, email, role, company, "createdAt" FROM "User" ${where} ORDER BY "createdAt" DESC`, qParams);
    case "sprints": {
      const sprintWhere = isAdmin ? "" : ' WHERE s."company" = ?';
      const tpCompanyFilter = isAdmin ? "" : ' AND tp2."company" = ?';
      const subParams = isAdmin ? [] : [company];
      return await selectAll(`
        SELECT s.*,
          (SELECT tp2."title" FROM "TestPlan" tp2
            WHERE (LOWER(TRIM(tp2."sprint")) = LOWER(TRIM(s."name"))
              OR LOWER(TRIM(s."name")) LIKE LOWER(TRIM(tp2."sprint")) || '%'
              OR LOWER(TRIM(tp2."sprint")) LIKE LOWER(TRIM(s."name")) || '%')
            ${tpCompanyFilter}
            AND tp2."deletedAt" IS NULL
            ORDER BY tp2."updatedAt" DESC LIMIT 1) AS testPlanTitle,
          (SELECT tp2."project" FROM "TestPlan" tp2
            WHERE (LOWER(TRIM(tp2."sprint")) = LOWER(TRIM(s."name"))
              OR LOWER(TRIM(s."name")) LIKE LOWER(TRIM(tp2."sprint")) || '%'
              OR LOWER(TRIM(tp2."sprint")) LIKE LOWER(TRIM(s."name")) || '%')
            ${tpCompanyFilter}
            AND tp2."deletedAt" IS NULL
            ORDER BY tp2."updatedAt" DESC LIMIT 1) AS project
        FROM "Sprint" s
        ${sprintWhere}
        ORDER BY s."startDate" DESC
      `, [...subParams, ...subParams, ...qParams]);
    }
    case "deployments":
      return (await selectAll(`SELECT "id", "company", "project", "date", "version", "changelog", "status", "createdAt", "updatedAt", "deletedAt" FROM "Deployment" ${where} ORDER BY "date" DESC, "createdAt" DESC`, qParams)).map(hydrateDeploymentNotes);
    default:
      return [];
  }
}

export async function getModuleRowsPage(module: ModuleKey, page: number, pageSize: number, search?: string) {
  const scope = getAccessScope(await getCurrentUser());
  const { company, isAdmin, andWhere, params: qParams } = scope;
  const safePage = Math.max(1, Math.floor(page || 1));
  const safeSize = Math.max(1, Math.floor(pageSize || 10));
  const offset = (safePage - 1) * safeSize;
  const limitClause = ` LIMIT ${safeSize} OFFSET ${offset}`;
  const { clause: searchClause, params: searchParams } = buildSearchClause(module, search ?? "", company);

  switch (module) {
    case "test-plans": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "TestPlan" WHERE "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}${searchClause}`, [...(isAdmin ? [] : [company]), ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = (await selectAll(`SELECT "id", "company", "publicToken", "title", "project", "sprint", "scope", "status", "startDate", "endDate", "notes", "assignee", "createdAt", "updatedAt", "deletedAt" FROM "TestPlan" WHERE "deletedAt" IS NULL ${andWhere}${searchClause} ORDER BY "updatedAt" DESC${limitClause}`, [...qParams, ...searchParams])).map((item) => {
        const normalized = normalizeTestPlanRow(item);
        return {
          ...normalized,
          code: codeFromId("PLAN", Number(item.id)),
          publicToken: normalized.publicToken || "",
        };
      });
      return { rows, total };
    }
    case "test-sessions": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "TestSession" WHERE 1=1${andWhere}${searchClause}`, [...qParams, ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = await selectAll(`SELECT "id", "company", "project", "date", "tester", "scope", "totalCases", "passed", "failed", "blocked", "result", "notes", "createdAt", "updatedAt", "deletedAt" FROM "TestSession" WHERE 1=1${andWhere}${searchClause} ORDER BY "updatedAt" DESC${limitClause}`, [...qParams, ...searchParams]);
      return { rows, total };
    }
    case "test-cases": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "TestCase" WHERE "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}${searchClause}`, [...(isAdmin ? [] : [company]), ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = (await selectAll(`SELECT "id", "company", "publicToken", "testSuiteId", "tcId", "typeCase", "preCondition", "caseName", "assignee", "testStep", "expectedResult", "actualResult", "status", "evidence", "priority", "sortOrder", "createdAt", "updatedAt", "deletedAt" FROM "TestCase" WHERE "deletedAt" IS NULL ${andWhere}${searchClause} ORDER BY COALESCE("sortOrder", 0) ASC, "updatedAt" DESC${limitClause}`, [...qParams, ...searchParams])).map((item) => normalizeTestCaseRow(item));
      return { rows, total };
    }
    case "bugs": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "Bug" WHERE 1=1${andWhere}${searchClause}`, [...qParams, ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = await selectAll(`SELECT "id", "company", "project", "module", "bugType", "title", "preconditions", "stepsToReproduce", "expectedResult", "actualResult", "severity", "priority", "status", "evidence", "relatedItems", "suggestedDev", "sortOrder", "createdAt", "updatedAt", "deletedAt" FROM "Bug" WHERE 1=1${andWhere}${searchClause} ORDER BY COALESCE("sortOrder", 0) ASC, "updatedAt" DESC${limitClause}`, [...qParams, ...searchParams]);
      return { rows, total };
    }
    case "tasks": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "Task" WHERE 1=1${andWhere}${searchClause}`, [...qParams, ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = await selectAll(`SELECT "id", "company", "title", "project", "relatedFeature", "category", "status", "priority", "dueDate" AS "startDate", "dueDate" AS "endDate", "description", "acceptanceCriteria", "assignee", "evidence", "sortOrder", "createdAt", "updatedAt", "deletedAt" FROM "Task" WHERE 1=1${andWhere}${searchClause} ORDER BY COALESCE("sortOrder", 0) ASC, "updatedAt" DESC${limitClause}`, [...qParams, ...searchParams]);
      return { rows, total };
    }
    case "test-suites": {
      const suiteCompanyWhere = isAdmin ? "" : ' AND ts."company" = ?';
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "TestSuite" ts WHERE ts."deletedAt" IS NULL${isAdmin ? "" : ' AND ts."company" = ?'}${searchClause}`, [...(isAdmin ? [] : [company]), ...searchParams]) as { total?: number } | undefined;
      const rows = (await selectAll(
        `WITH case_stats AS (
          SELECT tc."testSuiteId" as suiteId,
            SUM(CASE WHEN LOWER(COALESCE(tc."status", '')) = 'passed' THEN 1 ELSE 0 END) as passed,
            SUM(CASE WHEN LOWER(COALESCE(tc."status", '')) = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN LOWER(COALESCE(tc."status", '')) = 'blocked' THEN 1 ELSE 0 END) as blocked
          FROM "TestCase" tc
          WHERE tc."deletedAt" IS NULL${isAdmin ? "" : ' AND tc."company" = ?'}
          GROUP BY tc."testSuiteId"
        )
        SELECT ts.*, COALESCE(cs.passed, 0) as passed, COALESCE(cs.failed, 0) as failed, COALESCE(cs.blocked, 0) as blocked
         FROM "TestSuite" ts
          LEFT JOIN case_stats cs ON CAST(cs.suiteId AS INTEGER) = ts.id
         WHERE ts."deletedAt" IS NULL${suiteCompanyWhere}${searchClause} ORDER BY ts."updatedAt" DESC${limitClause}`,
        isAdmin ? [...searchParams] : [company, company, ...searchParams]
      )).map((item) => ({
        ...normalizeTestSuiteRow(item),
        code: codeFromId("SUITE", Number(item.id)),
        passed: Number(item.passed ?? 0),
        failed: Number(item.failed ?? 0),
        blocked: Number(item.blocked ?? 0),
      }));
      return { rows, total: Number(totalRow?.total ?? 0) };
    }
    case "assignees": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "User" WHERE "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}${searchClause}`, [...(isAdmin ? [] : [company]), ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = await selectAll(`SELECT id, name, role, email, '' as skills, 'active' as status, "createdAt", "updatedAt"
        FROM "User" WHERE "deletedAt" IS NULL ${andWhere}${searchClause} ORDER BY "updatedAt" DESC${limitClause}`, [...qParams, ...searchParams]);
      return { rows, total };
    }
    case "meeting-notes": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "MeetingNote" WHERE "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}${searchClause}`, [...(isAdmin ? [] : [company]), ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = (await selectAll(`SELECT "id", "company", "title", "date", "project", "relatedItems", "summary", "actionItems", "status", "publicToken", "createdAt", "updatedAt", "deletedAt" FROM "MeetingNote" WHERE "deletedAt" IS NULL ${andWhere}${searchClause} ORDER BY "date" DESC, "updatedAt" DESC${limitClause}`, [...qParams, ...searchParams])).map((item) => ({
        ...item,
        code: codeFromId("MEET", Number(item.id)),
      }));
      return { rows, total };
    }
    case "users": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "User" WHERE 1=1${andWhere}${searchClause}`, [...qParams, ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = await selectAll(`SELECT id, name, email, role, company, "createdAt" FROM "User" WHERE 1=1${andWhere}${searchClause} ORDER BY "createdAt" DESC${limitClause}`, [...qParams, ...searchParams]);
      return { rows, total };
    }
    case "sprints": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "Sprint" s WHERE s."deletedAt" IS NULL${isAdmin ? "" : ' AND s."company" = ?'}${searchClause}`, [...(isAdmin ? [] : [company]), ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const sprintWhere = isAdmin ? "" : ' WHERE s."company" = ?';
      const tpCompanyFilter = isAdmin ? "" : ' AND tp2."company" = ?';
      const subParams = isAdmin ? [] : [company];
      const rows = await selectAll(`
        SELECT s.*,
          (SELECT tp2."title" FROM "TestPlan" tp2
            WHERE (LOWER(TRIM(tp2."sprint")) = LOWER(TRIM(s."name"))
              OR LOWER(TRIM(s."name")) LIKE LOWER(TRIM(tp2."sprint")) || '%'
              OR LOWER(TRIM(tp2."sprint")) LIKE LOWER(TRIM(s."name")) || '%')
            ${tpCompanyFilter}
            AND tp2."deletedAt" IS NULL
            ORDER BY tp2."updatedAt" DESC LIMIT 1) AS testPlanTitle,
          (SELECT tp2."project" FROM "TestPlan" tp2
            WHERE (LOWER(TRIM(tp2."sprint")) = LOWER(TRIM(s."name"))
              OR LOWER(TRIM(s."name")) LIKE LOWER(TRIM(tp2."sprint")) || '%'
              OR LOWER(TRIM(tp2."sprint")) LIKE LOWER(TRIM(s."name")) || '%')
            ${tpCompanyFilter}
            AND tp2."deletedAt" IS NULL
            ORDER BY tp2."updatedAt" DESC LIMIT 1) AS project
        FROM "Sprint" s
        ${sprintWhere}${isAdmin ? ' WHERE s."deletedAt" IS NULL' : ' AND s."deletedAt" IS NULL'}${searchClause}
        ORDER BY s."startDate" DESC${limitClause}
      `, [...subParams, ...subParams, ...qParams, ...searchParams]);
      return { rows, total };
    }
    case "deployments": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "Deployment" WHERE "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}${searchClause}`, [...(isAdmin ? [] : [company]), ...searchParams]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = (await selectAll(`SELECT "id", "company", "project", "date", "version", "changelog", "status", "createdAt", "updatedAt", "deletedAt" FROM "Deployment" WHERE "deletedAt" IS NULL ${andWhere}${searchClause} ORDER BY "date" DESC, "createdAt" DESC${limitClause}`, [...qParams, ...searchParams])).map(hydrateDeploymentNotes);
      return { rows, total };
    }
    default:
      return { rows: [], total: 0 };
  }
}

export async function createModuleRecord(module: ModuleKey, data: any) {
  const user = await getCurrentUser();
  const company = getWriteCompany(user, data.company);


  switch (module) {
    case "test-plans": {
      const publicToken = data.publicToken || makePublicToken();
      const res = await runInsert(
        `INSERT INTO "TestPlan" ("company", "publicToken", "title", "project", "sprint", "scope", "status", "startDate", "endDate", "notes", "assignee")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, publicToken, data.title, data.project, data.sprint, data.scope, data.status, data.startDate, data.endDate, data.notes ?? "", data.assignee ?? ""]
      );
      await logActivity(company, "TestPlan", String(data.title), "Created", `New test plan: ${data.title}`);
      invalidateDashboardCache(company);
      await syncSprintFromTestPlan({ company, sprintName: data.sprint, startDate: data.startDate, endDate: data.endDate, goal: data.title });
      const created = await db.get<{ id?: number | string }>(`SELECT "id" FROM "TestPlan" WHERE "company" = ? AND "publicToken" = ? ORDER BY "id" DESC LIMIT 1`, [company, publicToken]);
      if (created?.id !== undefined) {
        await syncSearchIndex("test-plans", company, Number(created.id), data);
      }
      return res;
    }
    case "test-cases": {
      const publicToken = data.publicToken || makePublicToken();
      const res = await runInsert(
        `INSERT INTO "TestCase" ("company", "publicToken", "testSuiteId", "tcId", "typeCase", "preCondition", "caseName", "assignee", "testStep", "expectedResult", "actualResult", "status", "evidence", "priority")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, publicToken, data.testSuiteId, data.tcId, data.typeCase, data.preCondition, data.caseName, data.assignee ?? "", data.testStep, data.expectedResult, data.actualResult ?? "", data.status, data.evidence ?? "", data.priority ?? "Medium"]
      );
      await logActivity(company, "TestCase", String(data.tcId), "Created", `Added test case: ${data.tcId} - ${data.caseName}`);
      invalidateDashboardCache(company);
      const created = await db.get<{ id?: number | string }>(`SELECT "id" FROM "TestCase" WHERE "company" = ? AND "publicToken" = ? ORDER BY "id" DESC LIMIT 1`, [company, publicToken]);
      if (created?.id !== undefined) {
        await syncSearchIndex("test-cases", company, Number(created.id), data);
      }
      return res;
    }
    case "bugs": {
      const lastDevRes = await db.get('SELECT "suggestedDev" FROM "Bug" WHERE "module" = ? AND "company" = ? ORDER BY "id" DESC LIMIT 1', [data.module, company]) as any;
      const suggestedDev = data.suggestedDev || lastDevRes?.suggestedDev || "";
      const res = await runInsert(
        `INSERT INTO "Bug" ("company", "project", "module", "bugType", "title", "preconditions", "stepsToReproduce", "expectedResult", "actualResult", "severity", "priority", "status", "evidence", "relatedItems", "suggestedDev")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.project, data.module, data.bugType, data.title, data.preconditions, data.stepsToReproduce, data.expectedResult, data.actualResult, data.severity, data.priority, data.status, data.evidence, data.relatedItems, suggestedDev],
      );
      await logActivity(company, "Bug", String(data.title), "Created", `New bug recorded: ${data.title}`);
      invalidateDashboardCache(company);
      const created = await db.get<{ id?: number | string }>(`SELECT "id" FROM "Bug" WHERE "company" = ? AND "project" = ? AND "module" = ? AND "bugType" = ? AND "title" = ? ORDER BY "id" DESC LIMIT 1`, [company, data.project, data.module, data.bugType, data.title]);
      if (created?.id !== undefined) {
        await syncSearchIndex("bugs", company, Number(created.id), data);
      }
      return res;
    }
    case "tasks": {
      const res = await runInsert(
        `INSERT INTO "Task" ("company", "title", "project", "relatedFeature", "category", "status", "priority", "dueDate", "description", "acceptanceCriteria", "notes", "evidence", "relatedItems", "assignee")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.acceptanceCriteria, data.notes, data.evidence, data.relatedItems, data.assignee ?? ""],
      );
      await logActivity(company, "Task", String(data.title), "Created", `New task assigned: ${data.title}`);
      invalidateDashboardCache(company);
      const created = await db.get<{ id?: number | string }>(`SELECT "id" FROM "Task" WHERE "company" = ? AND "title" = ? ORDER BY "id" DESC LIMIT 1`, [company, data.title]);
      if (created?.id !== undefined) {
        await syncSearchIndex("tasks", company, Number(created.id), data);
      }
      return res;
    }
    case "test-sessions": {
      const res = await runInsert(
        `INSERT INTO "TestSession" ("company", "date", "project", "sprint", "tester", "scope", "totalCases", "passed", "failed", "blocked", "result", "notes", "evidence")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.date, data.project, data.sprint, data.tester, data.scope, data.totalCases, data.passed, data.failed, data.blocked, data.result, data.notes, data.evidence]
      );
      await logActivity(company, "Session", data.date, "Executed", `Test execution session by ${data.tester} (${data.result})`);
      const created = await db.get<{ id?: number | string }>(`SELECT "id" FROM "TestSession" WHERE "company" = ? AND "date" = ? AND "project" = ? AND "sprint" = ? AND "tester" = ? ORDER BY "id" DESC LIMIT 1`, [company, data.date, data.project, data.sprint, data.tester]);
      if (created?.id !== undefined) {
        await syncSearchIndex("test-sessions", company, Number(created.id), data);
      }
      return res;
    }
    case "test-suites": {
      const res = await runInsert(
        `INSERT INTO "TestSuite" ("company", "publicToken", "testPlanId", "title", "assignee", "status", "notes")
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [company, data.publicToken || makePublicToken(), data.testPlanId, data.title, data.assignee ?? "", data.status, data.notes ?? ""]
      );
      await logActivity(company, "TestSuite", String(data.title), "Created", `Suite created: ${data.title}`);
      invalidateDashboardCache(company);
      const created = await db.get<{ id?: number | string }>(`SELECT "id" FROM "TestSuite" WHERE "company" = ? AND "publicToken" = ? ORDER BY "id" DESC LIMIT 1`, [company, data.publicToken || ""]);
      if (created?.id !== undefined) {
        await syncSearchIndex("test-suites", company, Number(created.id), data);
      }
      return res;
    }
    case "assignees": {
      const res = await runInsert(
        `INSERT INTO "Assignee" ("company", "name", "role", "email", "skills", "status")
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company, data.name, data.role ?? "", data.email ?? "", data.skills ?? "", data.status]
      );
      await logActivity(company, "Assignee", String(data.name), "Added", `New team member: ${data.name}`);
      invalidateDashboardCache(company);
      return res;
    }
    case "users": {
      const existing = await db.get<{ id: number }>('SELECT "id" FROM "User" WHERE "email" = ?', [data.email]);
      if (existing) {
        throw new Error("Email address is already registered. Please use a different email.");
      }
      const { hashPassword } = await import("@/lib/auth-core");
      const hashedPassword = await hashPassword(data.password || "password123");
      const res = await runInsert(
        `INSERT INTO "User" ("company", "name", "email", "password", "role")
         VALUES (?, ?, ?, ?, ?)`,
        [company, data.name || data.email, data.email, hashedPassword, data.role || "user"]
      );
      const user = await db.get<{ id: number; company: string; name: string | null; email: string | null; role: string | null }>(
        'SELECT "id", "company", "name", "email", "role" FROM "User" WHERE "email" = ?',
        [data.email],
      );
      if (user) {
        await syncAssigneeFromUser(user);
        await syncSearchIndex("users", company, user.id, user);
        await syncSearchIndex("assignees", company, user.id, { ...user, status: "active" });
      }
      await logActivity(company, "User", String(data.email), "Created", `Access granted for ${data.email}`);
      invalidateDashboardCache(company);
      return res;
    }
    case "sprints": {
      const existingSprint = await db.get<{ id: number }>(
        `SELECT "id" FROM "Sprint" WHERE LOWER(TRIM("name")) = LOWER(TRIM(?)) AND "company" = ? AND "deletedAt" IS NULL`,
        [data.name, company],
      );
      if (existingSprint) {
        throw new Error("A sprint with this name already exists. Please use a different name.");
      }
      const res = await runInsert(
        `INSERT INTO "Sprint" ("company", "name", "startDate", "endDate", "status", "goal")
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company, data.name, data.startDate, data.endDate, data.status, data.goal ?? ""]
      );
      await logActivity(company, "Sprint", String(data.name), "Created", `Sprint ${data.name} started`);
      invalidateDashboardCache(company);
      const created = await db.get<{ id?: number | string }>(`SELECT "id" FROM "Sprint" WHERE "company" = ? AND "name" = ? ORDER BY "id" DESC LIMIT 1`, [company, data.name]);
      if (created?.id !== undefined) {
        await syncSearchIndex("sprints", company, Number(created.id), data);
      }
      return res;
    }
    case "meeting-notes": {
      const res = await runInsert(
        `INSERT INTO "MeetingNote" ("company", "publicToken", "date", "project", "title", "attendees", "content", "summary", "actionItems", "relatedItems")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.publicToken || makePublicToken(), data.date || new Date().toISOString(), data.project, data.title, data.attendees ?? "", data.content ?? "", data.content ?? "", data.actionItems ?? "", data.relatedItems ?? ""]
      );
      await logActivity(company, "MeetingNote", String(data.title), "Created", `Notes recorded for: ${data.title}`);
      invalidateDashboardCache(company);
      const created = await db.get<{ id?: number | string }>(`SELECT "id" FROM "MeetingNote" WHERE "company" = ? AND "publicToken" = ? ORDER BY "id" DESC LIMIT 1`, [company, data.publicToken || ""]);
      if (created?.id !== undefined) {
        await syncSearchIndex("meeting-notes", company, Number(created.id), data);
      }
      return res;
    }
    case "deployments": {
      const notes = generateDeploymentNotes(String(data.changelog ?? ""));
      const res = await runInsert(
        `INSERT INTO "Deployment" ("company", "date", "version", "project", "environment", "developer", "changelog", "status", "notes")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.date, data.version, data.project, data.environment, data.developer, data.changelog ?? "", data.status, notes]
      );
      await logActivity(company, "Deployment", String(data.version), "Deployed", `Deployment ${data.version} to ${data.environment}: ${data.status}`);
      invalidateDashboardCache(company);
      const created = await db.get<{ id?: number | string }>(`SELECT "id" FROM "Deployment" WHERE "company" = ? AND "version" = ? ORDER BY "id" DESC LIMIT 1`, [company, data.version]);
      if (created?.id !== undefined) {
        await syncSearchIndex("deployments", company, Number(created.id), data);
      }
      return res;
    }
    default:
      return null;
  }
}

export async function updateModuleRecord(module: ModuleKey, id: string | number, data: any) {
  const scope = getAccessScope(await getCurrentUser());
  const { company, where: _where, andWhere: companyFilter, params: companyParam } = scope;


  switch (module) {
    case "tasks": {
      const res = await db.run(
        `UPDATE "Task"
         SET "title" = ?, "project" = ?, "relatedFeature" = ?, "category" = ?, "status" = ?, "priority" = ?, "dueDate" = ?, "description" = ?, "acceptanceCriteria" = ?, "notes" = ?, "evidence" = ?, "relatedItems" = ?, "assignee" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.acceptanceCriteria, data.notes, data.evidence, data.relatedItems, data.assignee ?? "", id, ...companyParam]
      );
      await logActivity(company, "Task", String(data.title), "Updated", `Task ${data.title} updated to ${data.status}`);
      invalidateDashboardCache(company);
      const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "Task" WHERE "id" = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
      if (updatedRow) {
        await syncSearchIndex("tasks", company, String(id), updatedRow);
      }
      return res;
    }
    case "bugs": {
      const res = await db.run(
        `UPDATE "Bug"
         SET "project" = ?, "module" = ?, "bugType" = ?, "title" = ?, "preconditions" = ?, "stepsToReproduce" = ?, "expectedResult" = ?, "actualResult" = ?, "severity" = ?, "priority" = ?, "status" = ?, "evidence" = ?, "relatedItems" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.project, data.module, data.bugType, data.title, data.preconditions, data.stepsToReproduce, data.expectedResult, data.actualResult, data.severity, data.priority, data.status, data.evidence, data.relatedItems, id, ...companyParam]
      );
      await logActivity(company, "Bug", String(data.title), "Updated", `Bug ${data.title} marked as ${data.status}`);
      invalidateDashboardCache(company);
      const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "Bug" WHERE "id" = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
      if (updatedRow) {
        await syncSearchIndex("bugs", company, String(id), updatedRow);
      }
      return res;
    }
    case "test-plans": {
      const res = await db.run(
        `UPDATE "TestPlan"
         SET "title" = ?, "project" = ?, "sprint" = ?, "scope" = ?, "startDate" = ?, "endDate" = ?, "status" = ?, "notes" = ?, "assignee" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.title, data.project, data.sprint, data.scope, data.startDate, data.endDate, data.status, data.notes, data.assignee ?? "", id, ...companyParam]
      );
      await logActivity(company, "TestPlan", String(data.title), "Updated", `Plan ${data.title} revised`);
      invalidateDashboardCache(company);
      await syncSprintFromTestPlan({ company, sprintName: data.sprint, startDate: data.startDate, endDate: data.endDate, goal: data.title });
      const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "TestPlan" WHERE "id" = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
      if (updatedRow) {
        await syncSearchIndex("test-plans", company, String(id), updatedRow);
      }
      return res;
    }
    case "test-sessions": {
      const res = await db.run(
        `UPDATE "TestSession"
         SET "date" = ?, "project" = ?, "sprint" = ?, "tester" = ?, "scope" = ?, "totalCases" = ?, "passed" = ?, "failed" = ?, "blocked" = ?, "result" = ?, "notes" = ?, "evidence" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.date, data.project, data.sprint, data.tester, data.scope, data.totalCases, data.passed, data.failed, data.blocked, data.result, data.notes, data.evidence, id, ...companyParam]
      );
      await logActivity(company, "Session", String(data.date), "Updated", `Test session results updated`);
      const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "TestSession" WHERE "id" = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
      if (updatedRow) {
        await syncSearchIndex("test-sessions", company, String(id), updatedRow);
      }
      return res;
    }
    case "test-cases": {
      const res = await db.run(
        `UPDATE "TestCase"
         SET "testSuiteId" = ?, "tcId" = ?, "typeCase" = ?, "preCondition" = ?, "caseName" = ?, "assignee" = ?, "testStep" = ?, "expectedResult" = ?, "actualResult" = ?, "status" = ?, "evidence" = ?, "priority" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.testSuiteId, data.tcId, data.typeCase, data.preCondition, data.caseName, data.assignee ?? "", data.testStep, data.expectedResult, data.actualResult ?? "", data.status, data.evidence ?? "", data.priority ?? "Medium", id, ...companyParam]
      );
      await logActivity(company, "TestCase", String(data.caseName), "Updated", `Test case ${data.caseName} updated`);
      invalidateDashboardCache(company);
      const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "TestCase" WHERE "id" = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
      if (updatedRow) {
        await syncSearchIndex("test-cases", company, String(id), updatedRow);
      }
      return res;
    }
    case "test-suites": {
      const suitePlanId = String(data.testPlanId ?? "");
      const res = await db.run(
        `UPDATE "TestSuite"
         SET "testPlanId" = ?, "title" = ?, "assignee" = ?, "status" = ?, "notes" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [suitePlanId, data.title, data.assignee ?? "", data.status, data.notes, id, ...companyParam]
      );
      await logActivity(company, "TestSuite", String(data.title), "Updated", `Suite ${data.title} updated`);
      invalidateDashboardCache(company);
      const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "TestSuite" WHERE "id" = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
      if (updatedRow) {
        await syncSearchIndex("test-suites", company, String(id), updatedRow);
      }
      return res;
    }
    case "assignees": {
      const res = await db.run(
        `UPDATE "Assignee"
         SET "name" = ?, "role" = ?, "email" = ?, "skills" = ?, "status" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.name, data.role ?? "", data.email ?? "", data.skills ?? "", data.status, id, ...companyParam]
      );
      await logActivity(company, "Assignee", String(data.name), "Updated", `Profile for ${data.name} updated`);
      invalidateDashboardCache(company);
      return res;
    }
    case "users": {
      const existingEmail = await db.get<{ id: number }>('SELECT "id" FROM "User" WHERE "email" = ? AND "id" != CAST(? AS INTEGER)', [data.email, id]);
      if (existingEmail) {
        throw new Error("Email address is already registered. Please use a different email.");
      }
      const { hashPassword } = await import("@/lib/auth-core");
      if (data.password) {
        const hashedPassword = await hashPassword(data.password);
        const res = await db.run(
          `UPDATE "User" SET "name" = ?, "email" = ?, "role" = ?, "password" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
          [data.name, data.email, data.role, hashedPassword, id, ...companyParam]
        );
        const updatedUser = { id: Number(id), company, name: data.name, email: data.email, role: data.role };
        await syncAssigneeFromUser(updatedUser);
        await syncSearchIndex("users", company, updatedUser.id, updatedUser);
        await syncSearchIndex("assignees", company, updatedUser.id, { ...updatedUser, status: "active" });
        await logActivity(company, "User", String(data.email), "Updated", `Security settings for ${data.email} updated`);
        invalidateDashboardCache(company);
        return res;
      } else {
        const res = await db.run(
          `UPDATE "User" SET "name" = ?, "email" = ?, "role" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
          [data.name, data.email, data.role, id, ...companyParam]
        );
        const updatedUser = { id: Number(id), company, name: data.name, email: data.email, role: data.role };
        await syncAssigneeFromUser(updatedUser);
        await syncSearchIndex("users", company, updatedUser.id, updatedUser);
        await syncSearchIndex("assignees", company, updatedUser.id, { ...updatedUser, status: "active" });
        await logActivity(company, "User", String(data.email), "Updated", `User info for ${data.email} updated`);
        invalidateDashboardCache(company);
        return res;
      }
    }
    case "sprints": {
      const res = await db.run(
        `UPDATE "Sprint"
         SET "name" = ?, "startDate" = ?, "endDate" = ?, "status" = ?, "goal" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.name, data.startDate, data.endDate, data.status, data.goal ?? "", id, ...companyParam]
      );
      await logActivity(company, "Sprint", String(data.name), "Updated", `Sprint ${data.name} updated to ${data.status}`);
      invalidateDashboardCache(company);
      const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "Sprint" WHERE "id" = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
      if (updatedRow) {
        await syncSearchIndex("sprints", company, String(id), updatedRow);
      }
      return res;
    }
    case "meeting-notes": {
      const res = await db.run(
        `UPDATE "MeetingNote"
         SET "date" = ?, "project" = ?, "title" = ?, "attendees" = ?, "content" = ?, "summary" = ?, "actionItems" = ?, "relatedItems" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.date, data.project, data.title, data.attendees ?? "", data.content ?? "", data.content ?? "", data.actionItems ?? "", data.relatedItems ?? "", id, ...companyParam]
      );
      await logActivity(company, "MeetingNote", String(data.title), "Updated", `Meeting notes for ${data.title} revised`);
      invalidateDashboardCache(company);
      const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "MeetingNote" WHERE "id" = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
      if (updatedRow) {
        await syncSearchIndex("meeting-notes", company, String(id), updatedRow);
      }
      return res;
    }
    case "deployments": {
      const notes = generateDeploymentNotes(String(data.changelog ?? ""));
      const res = await db.run(
        `UPDATE "Deployment"
         SET "date" = ?, "version" = ?, "project" = ?, "environment" = ?, "developer" = ?, "changelog" = ?, "status" = ?, "notes" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.date, data.version, data.project, data.environment, data.developer, data.changelog ?? "", data.status, notes, id, ...companyParam]
      );
      await logActivity(company, "Deployment", String(data.version), "Updated", `Deployment ${data.version} updated to ${data.status}`);
      invalidateDashboardCache(company);
      const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "Deployment" WHERE "id" = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
      if (updatedRow) {
        await syncSearchIndex("deployments", company, String(id), updatedRow);
      }
      return res;
    }
    default:
      return null;
  }
}

export async function deleteModuleRecord(module: ModuleKey, id: string | number) {
  const scope = getAccessScope(await getCurrentUser());
  const { company, andWhere: companyFilter, params: companyParam } = scope;

  const table = getTableName(module);
  if (!table) return null;

  const entityId = String(id);

  if (table === "User") {
    await deleteAssigneeForUser(Number(id));
  }

  const res = await db.run(`UPDATE "${table}" SET "deletedAt" = CURRENT_TIMESTAMP WHERE id = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
  await logActivity(company, table, entityId, "Deleted", `${table} removed`);
  await clearSearchIndex(module, company, entityId);
  if (table === "User") {
    await clearSearchIndex("assignees", company, entityId);
  }
  invalidateDashboardCache(company);
  return res;
}

export async function deleteModuleRecords(module: ModuleKey, ids: (string | number)[]) {
  if (ids.length === 0) return;
  const scope = getAccessScope(await getCurrentUser());
  const { company, andWhere: companyFilter, params: companyParam } = scope;

  const table = getTableName(module);
  if (!table) return;

  const placeholderList = ids.map(() => "?").join(", ");

  await db.run(
    `UPDATE "${table}" SET "deletedAt" = CURRENT_TIMESTAMP WHERE id IN (${placeholderList})${companyFilter}`,
    [...ids, ...companyParam]
  );

  await logActivity(company, table, ids.join(","), "Deleted", `${ids.length} ${table} records deleted`);
  for (const entityId of ids) {
    await clearSearchIndex(module, company, String(entityId));
    if (table === "User") {
      await clearSearchIndex("assignees", company, String(entityId));
    }
  }
  invalidateDashboardCache(company);
}

export {
  getTestPlanByToken,
  getTestPlanById,
  getTestSuitesByPlanId,
  getReleaseNotes,
  getQualityTrend,
  getTestSuite,
  getTestCasesByIdStrings,
  getProjectData,
  getTestSuiteByToken,
  getTestCasesByScenario,
  getTestCasesByScenarioIds,
  getAllTestCasesWithSuite,
  getPublicReportData,
} from "@/lib/test-management-data";

export async function updateModuleStatus(module: ModuleKey, id: string | number, status: string, sortOrder?: number) {
  const { company, andWhere, params: qParams } = getAccessScope(await getCurrentUser());

  const table = getTableName(module);
  if (!table) return null;
  const hasSortOrder = typeof sortOrder === "number" && Number.isFinite(sortOrder);
  const res = await db.run(
    `UPDATE "${table}" SET "status" = ?, ${hasSortOrder ? '"sortOrder" = ?, ' : ''}"updatedAt" = CURRENT_TIMESTAMP WHERE "id" = CAST(? AS INTEGER)${andWhere}`,
    hasSortOrder ? [status, sortOrder, id, ...qParams] : [status, id, ...qParams]
  );
  await logActivity(company, table, String(id), "Status Update", `${table} status updated to ${status}`);
  const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "${table}" WHERE id = CAST(? AS INTEGER)${andWhere}`, [id, ...qParams]);
  if (updatedRow) {
    await syncSearchIndex(module, company, String(id), updatedRow);
  }
  invalidateDashboardCache(company);
  return res;
}

export async function clearModuleRecords(module: ModuleKey) {
  const { company, where, params } = getAccessScope(await getCurrentUser());

  const table = getTableName(module);
  if (!table) return null;
  const rows = shouldIndexModule(module) ? await selectAll(`SELECT "id" FROM "${table}"${where}`, params) : [];
  const res = await db.run(`DELETE FROM "${table}"${where}`, params);
  await logActivity(company, table, "ALL", "Cleared", `${table} records cleared`);
  for (const row of rows) {
    await clearSearchIndex(module, company, String(row.id));
    if (table === "User") {
      await clearSearchIndex("assignees", company, String(row.id));
    }
  }
  invalidateDashboardCache(company);
  return res;
}

export async function replaceModuleRecords(module: ModuleKey, rows: any[]) {
  for (const row of rows) {
    await createModuleRecord(module, row);
  }
}

export async function getModuleSheetRows(module: ModuleKey) {
  const rows = await getModuleRows(module);
  return rows.map((row) => moduleConfigs[module].toRow(row as Record<string, unknown>));
}
