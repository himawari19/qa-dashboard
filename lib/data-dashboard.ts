import { db, isPostgres } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { countRows, getAccessScope, normalizeTestPlanRow, normalizeTestSuiteRow } from "@/lib/data-helpers";
import { getQualityTrend, getReleaseNotes } from "@/lib/test-management-data";
import { generateDeploymentNotes } from "@/lib/deployment-notes";
import { getRoleLabel, normalizeRole } from "@/lib/roles";

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
  ]);

  // Heatmap: merge 4 lightweight queries instead of 1 heavy CTE
  const [heatTaskCounts, heatBugCounts, heatSuiteCounts, heatPlanCounts] = await Promise.all([
    selectAll(`SELECT assignee as name, COUNT(*) as cnt FROM "Task" WHERE status != 'done' AND assignee != '' ${projectAndWhere} GROUP BY assignee`, projectParams),
    selectAll(`SELECT "suggestedDev" as name, COUNT(*) as cnt FROM "Bug" WHERE status != 'closed' AND "suggestedDev" != '' ${projectAndWhere} GROUP BY "suggestedDev"`, projectParams),
    selectAll(`SELECT assignee as name, COUNT(*) as cnt FROM "TestSuite" WHERE status != 'archived' AND assignee != '' ${companyAndWhere} GROUP BY assignee`, companyParams),
    selectAll(`SELECT assignee as name, COUNT(*) as cnt FROM "TestPlan" WHERE status != 'closed' AND assignee != '' ${projectAndWhere} GROUP BY assignee`, projectParams),
  ]);

  const heatmap = new Map<string, { taskCount: number; bugCount: number; suiteCount: number; planCount: number }>();
  for (const row of heatTaskCounts) {
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    const entry = heatmap.get(name) || { taskCount: 0, bugCount: 0, suiteCount: 0, planCount: 0 };
    entry.taskCount = Number(row.cnt ?? 0);
    heatmap.set(name, entry);
  }
  for (const row of heatBugCounts) {
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    const entry = heatmap.get(name) || { taskCount: 0, bugCount: 0, suiteCount: 0, planCount: 0 };
    entry.bugCount = Number(row.cnt ?? 0);
    heatmap.set(name, entry);
  }
  for (const row of heatSuiteCounts) {
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    const entry = heatmap.get(name) || { taskCount: 0, bugCount: 0, suiteCount: 0, planCount: 0 };
    entry.suiteCount = Number(row.cnt ?? 0);
    heatmap.set(name, entry);
  }
  for (const row of heatPlanCounts) {
    const name = String(row.name ?? "").trim();
    if (!name) continue;
    const entry = heatmap.get(name) || { taskCount: 0, bugCount: 0, suiteCount: 0, planCount: 0 };
    entry.planCount = Number(row.cnt ?? 0);
    heatmap.set(name, entry);
  }
  const heatmapRes = [...heatmap.entries()].map(([name, counts]) => ({ name, ...counts }));

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
  const sprintBurndown: { date: string; done: number; ideal: number }[] = [];
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
  dashboardCache.set(cacheKey, { data, expiresAt: Date.now() + 30000 });
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

