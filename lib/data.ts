import { db, isPostgres } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { moduleConfigs, type ModuleKey } from "@/lib/modules";
import {
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

type DashboardCacheEntry = { expiresAt: number; data: unknown };
const dashboardCache = new Map<string, DashboardCacheEntry>();

function dashboardCacheKey(company: string, isAdmin: boolean, role: string, projectFilter: string) {
  return [company, isAdmin ? "admin" : "user", role, projectFilter || "__all__"].join("|");
}

export function invalidateDashboardCache(company?: string) {
  if (!company) {
    dashboardCache.clear();
    return;
  }
  const prefix = `${company}|`;
  for (const key of dashboardCache.keys()) {
    if (key.startsWith(prefix)) dashboardCache.delete(key);
  }
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

export async function getAssigneeOptions() {
  const { company, isAdmin } = getAccessScope(await getCurrentUser());
  const rows = await selectAll(
    `SELECT DISTINCT "name" as value FROM "Assignee"
     WHERE COALESCE("name", '') != '' AND "status" = 'active'${isAdmin ? "" : ' AND "company" = ?'}
     ORDER BY "name" ASC`,
    isAdmin ? [] : [company],
  );
  return rows.map((row) => ({ value: String(row.value ?? ""), label: String(row.value ?? "") }));
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
    `SELECT id, testPlanId, title, publicToken
     FROM "TestSuite"
     WHERE "deletedAt" IS NULL
     ${isAdmin ? "" : ' AND "company" = ?'}
     AND "testPlanId" IN (${placeholders})
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
     AND tc."testSuiteId" IN (${placeholders})
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
    taskCount,
    bugCount,
    caseCount,
    taskStatus,
    bugSeverity,
    sprint,
    bugFixed,
    taskCompleted,
    bugTrend,
    allSprints,
    activity,
    bugByModule,
    todayTasks,
    todayBugs,
    todaySessions,
    critBugs,
    prioTasks,
    suiteCount,
    sessionCount,
    recentSessions,
    heatmapRes
  ] = await Promise.all([
    selectAll(`SELECT * FROM "Task" ${projectWhere} ORDER BY "updatedAt" DESC LIMIT 5`, projectParams),
    selectAll(`SELECT * FROM "Bug" ${projectWhere} ORDER BY "updatedAt" DESC LIMIT 5`, projectParams),
    selectAll(`SELECT * FROM "TestCase" ${companyWhere}${isAdmin ? "" : ' AND "deletedAt" IS NULL'} ORDER BY "updatedAt" DESC LIMIT 5`, companyParams),
    countRows("Task", company),
    countRows("Bug", company),
    countRows("TestCase", company),
    selectAll(`SELECT status, COUNT(*) as count FROM "Task" ${projectWhere} GROUP BY status`, projectParams),
    selectAll(`SELECT severity, COUNT(*) as count FROM "Bug" ${projectWhere} GROUP BY severity`, projectParams),
    db.get(`SELECT * FROM "Sprint" WHERE status = 'active' ${companyAndWhere} LIMIT 1`, companyParams) as Promise<any>,
    db.get(`SELECT COUNT(*) as count FROM "Bug" WHERE status IN ('fixed', 'closed') ${projectAndWhere}`, projectParams) as Promise<any>,
    db.get(`SELECT COUNT(*) as count FROM "Task" WHERE status = 'completed' ${projectAndWhere}`, projectParams) as Promise<any>,
    selectAll(`SELECT DATE("createdAt") as date, COUNT(*) as count FROM "Bug" WHERE "createdAt" >= DATE('now', '-7 days') ${projectAndWhere} GROUP BY DATE("createdAt") ORDER BY date ASC`, projectParams),
    selectAll(`SELECT id, name, startDate, endDate, status FROM "Sprint" ${companyWhere} ORDER BY startDate DESC LIMIT 20`, companyParams),
    selectAll(`SELECT * FROM "ActivityLog" ${companyWhere} ORDER BY "createdAt" DESC LIMIT 10`, companyParams),
    selectAll(`SELECT module, COUNT(*) as count FROM "Bug" ${projectWhere} GROUP BY module LIMIT 10`, projectParams),
    selectAll(`SELECT 'Task' as type, title as label, status FROM "Task" WHERE DATE("updatedAt") = DATE('now') ${projectAndWhere}`, projectParams),
    selectAll(`SELECT 'Bug' as type, title as label, status FROM "Bug" WHERE DATE("updatedAt") = DATE('now') ${projectAndWhere}`, projectParams),
    selectAll(`SELECT 'Session' as type, scope as label, result FROM "TestSession" WHERE DATE("createdAt") = DATE('now') ${projectAndWhere}`, projectParams),
    selectAll(`SELECT "id", "title", "severity" FROM "Bug" WHERE "severity" IN ('critical', 'high', 'P0', 'P1') AND "status" != 'closed' ${projectAndWhere} ORDER BY "createdAt" DESC`, projectParams),
    selectAll(`SELECT "id", "title", "priority" FROM "Task" WHERE "priority" IN ('High', 'Urgent', 'P0', 'P1') AND "status" != 'done' ${projectAndWhere} ORDER BY "createdAt" DESC`, projectParams),
    countRows("TestSuite", company),
    countRows("TestSession", company),
    selectAll(`SELECT id, date, tester, scope, totalCases, passed, failed, blocked, result FROM "TestSession" ${projectWhere} ORDER BY date DESC LIMIT 10`, projectParams),
    selectAll(`
      WITH AllAssignees AS (
        SELECT assignee as name FROM "Task" WHERE assignee != '' AND status != 'done' ${projectAndWhere}
        UNION
        SELECT suggestedDev as name FROM "Bug" WHERE suggestedDev != '' AND status != 'closed' ${projectAndWhere}
        UNION
        SELECT assignee as name FROM "TestSuite" WHERE assignee != '' AND status != 'archived' ${companyAndWhere}
        UNION
        SELECT assignee as name FROM "TestPlan" WHERE assignee != '' AND status != 'closed' ${projectAndWhere}
        UNION
        SELECT name FROM "Assignee" WHERE status = 'active' ${companyAndWhere}
      )
      SELECT 
        name,
        (SELECT COUNT(*) FROM "Task" t WHERE t.assignee = AllAssignees.name AND t.status != 'done' ${projectAndWhere}) as taskCount,
        (SELECT COUNT(*) FROM "Bug" b WHERE b.suggestedDev = AllAssignees.name AND b.status != 'closed' ${projectAndWhere}) as bugCount,
        (SELECT COUNT(*) FROM "TestSuite" s WHERE s.assignee = AllAssignees.name AND s.status != 'archived' ${companyAndWhere}) as suiteCount,
        (SELECT COUNT(*) FROM "TestPlan" p WHERE p.assignee = AllAssignees.name AND p.status != 'closed' ${projectAndWhere}) as planCount
      FROM AllAssignees
      WHERE name IS NOT NULL AND name != ''
      ORDER BY name ASC
    `, [...projectParams, ...projectParams, ...companyParams, ...projectParams, ...companyParams, ...projectParams, ...projectParams, ...projectParams, ...projectParams]),
  ]);

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
  const recentSprintsForRate = await selectAll(
    `SELECT id, name, startDate, endDate FROM "Sprint" ${companyWhere} ORDER BY startDate DESC LIMIT 5`,
    companyParams
  ) as any[];
  const sprintPassRates = await Promise.all(
    recentSprintsForRate.map(async (sp: any) => {
      const sessions = await selectAll(
        `SELECT passed, totalCases FROM "TestSession" WHERE DATE("date") BETWEEN ? AND ? ${projectAndWhere}`,
        [sp.startDate, sp.endDate, ...projectParams]
      ) as any[];
      const totalPassed = sessions.reduce((s: number, r: any) => s + Number(r.passed), 0);
      const totalCases = sessions.reduce((s: number, r: any) => s + Number(r.totalCases), 0);
      return {
        name: String(sp.name).replace(/sprint\s*/i, "S").substring(0, 12),
        passRate: totalCases > 0 ? Math.round(totalPassed * 100 / totalCases) : 0,
        sessions: sessions.length,
      };
    })
  );

  const successRate = (bugCount + taskCount) > 0 ? Math.round(((Number(bugFixed.count) + Number(taskCompleted.count)) / (bugCount + taskCount)) * 100) : 0;
  
  // Dynamic spotlight project
  const mostActiveProject = await db.get('SELECT project as name FROM "TestPlan" GROUP BY project ORDER BY COUNT(*) DESC LIMIT 1') as any;
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
    selectAll(`SELECT id, title, status, priority FROM "Task" WHERE assignee = ? ${andWhere} AND status != 'done' ORDER BY createdAt DESC`, [name, ...companyParam]),
    selectAll(`SELECT id, title, status, severity as priority FROM "Bug" WHERE suggestedDev = ? ${andWhere} AND status NOT IN ('closed', 'rejected') ORDER BY createdAt DESC`, [name, ...companyParam]),
    selectAll(`SELECT id, title, status, 'N/A' as priority FROM "TestSuite" WHERE assignee = ? ${andWhere} AND status != 'archived' ORDER BY createdAt DESC`, [name, ...companyParam]),
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
      return (await selectAll(`SELECT * FROM "TestPlan" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "updatedAt" DESC`, qParams)).map((item) => {
        const normalized = normalizeTestPlanRow(item);
        return {
          ...normalized,
          code: codeFromId("PLAN", Number(item.id)),
          publicToken: normalized.publicToken || "",
        };
      });
    case "test-sessions":
      return await selectAll(`SELECT * FROM "TestSession" ${where} ORDER BY "updatedAt" DESC`, qParams);
    case "test-cases":
      return (await selectAll(`SELECT * FROM "TestCase" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "updatedAt" DESC`, qParams)).map((item) => normalizeTestCaseRow(item));
    case "bugs":
      return await selectAll(`SELECT * FROM "Bug" ${where} ORDER BY "updatedAt" DESC`, qParams);
    case "tasks":
      return await selectAll(`SELECT * FROM "Task" ${where} ORDER BY "updatedAt" DESC`, qParams);
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
         LEFT JOIN case_stats cs ON cs.suiteId = ts.id
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
      // Emergency check to ensure table exists
      await db.exec(`CREATE TABLE IF NOT EXISTS "Assignee" (
        "id" ${isPostgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT"},
        "company" TEXT NOT NULL DEFAULT '',
        "name" TEXT NOT NULL,
        "role" TEXT,
        "email" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" ${isPostgres ? "TIMESTAMP" : "TEXT"} NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" ${isPostgres ? "TIMESTAMP" : "TEXT"} NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
      return (await selectAll(`SELECT * FROM "Assignee" ${where} ORDER BY "name" ASC`, qParams)).map((item) => ({
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
      return (await selectAll(`SELECT * FROM "MeetingNote" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "date" DESC, "updatedAt" DESC`, qParams)).map((item) => ({
        ...item,
        code: codeFromId("MEET", Number(item.id)),
      }));
    case "users":
      return await selectAll(`SELECT id, name, username, role, company, createdAt FROM "User" ${where} ORDER BY createdAt DESC`, qParams);
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
      return await selectAll(`SELECT * FROM "Deployment" ${where} ORDER BY "date" DESC, "createdAt" DESC`, qParams);
    default:
      return [];
  }
}

export async function getModuleRowsPage(module: ModuleKey, page: number, pageSize: number) {
  const scope = getAccessScope(await getCurrentUser());
  const { company, isAdmin, where, andWhere, params: qParams } = scope;
  const safePage = Math.max(1, Math.floor(page || 1));
  const safeSize = Math.max(1, Math.floor(pageSize || 10));
  const offset = (safePage - 1) * safeSize;
  const limitClause = ` LIMIT ${safeSize} OFFSET ${offset}`;

  switch (module) {
    case "test-plans": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "TestPlan" WHERE "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}`, isAdmin ? [] : [company]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = (await selectAll(`SELECT * FROM "TestPlan" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "updatedAt" DESC${limitClause}`, qParams)).map((item) => {
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
      const total = await countRows("TestSession", isAdmin ? undefined : company);
      const rows = await selectAll(`SELECT * FROM "TestSession" ${where} ORDER BY "updatedAt" DESC${limitClause}`, qParams);
      return { rows, total };
    }
    case "test-cases": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "TestCase" WHERE "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}`, isAdmin ? [] : [company]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = (await selectAll(`SELECT * FROM "TestCase" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "updatedAt" DESC${limitClause}`, qParams)).map((item) => normalizeTestCaseRow(item));
      return { rows, total };
    }
    case "bugs": {
      const total = await countRows("Bug", isAdmin ? undefined : company);
      const rows = await selectAll(`SELECT * FROM "Bug" ${where} ORDER BY "updatedAt" DESC${limitClause}`, qParams);
      return { rows, total };
    }
    case "tasks": {
      const total = await countRows("Task", isAdmin ? undefined : company);
      const rows = await selectAll(`SELECT * FROM "Task" ${where} ORDER BY "updatedAt" DESC${limitClause}`, qParams);
      return { rows, total };
    }
    case "test-suites": {
      const suiteCompanyWhere = isAdmin ? "" : ' AND ts."company" = ?';
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "TestSuite" ts WHERE ts."deletedAt" IS NULL${isAdmin ? "" : ' AND ts."company" = ?'}`, isAdmin ? [] : [company]) as { total?: number } | undefined;
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
         LEFT JOIN case_stats cs ON cs.suiteId = ts.id
         WHERE ts."deletedAt" IS NULL${suiteCompanyWhere} ORDER BY ts."updatedAt" DESC${limitClause}`,
        isAdmin ? [] : [company, company]
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
      const total = await countRows("Assignee", isAdmin ? undefined : company);
      const rows = await selectAll(`SELECT * FROM "Assignee" ${where} ORDER BY "updatedAt" DESC${limitClause}`, qParams);
      return { rows, total };
    }
    case "meeting-notes": {
      const totalRow = await db.get(`SELECT COUNT(*) as total FROM "MeetingNote" WHERE "deletedAt" IS NULL${isAdmin ? "" : ' AND "company" = ?'}`, isAdmin ? [] : [company]) as { total?: number } | undefined;
      const total = Number(totalRow?.total ?? 0);
      const rows = (await selectAll(`SELECT * FROM "MeetingNote" WHERE "deletedAt" IS NULL ${andWhere} ORDER BY "date" DESC, "updatedAt" DESC${limitClause}`, qParams)).map((item) => ({
        ...item,
        code: codeFromId("MEET", Number(item.id)),
      }));
      return { rows, total };
    }
    case "users": {
      const total = await countRows("User", isAdmin ? undefined : company);
      const rows = await selectAll(`SELECT id, name, username, role, company, createdAt FROM "User" ${where} ORDER BY createdAt DESC${limitClause}`, qParams);
      return { rows, total };
    }
    case "sprints": {
      const total = await countRows("Sprint", isAdmin ? undefined : company);
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
        ${sprintWhere}
        ORDER BY s."startDate" DESC${limitClause}
      `, [...subParams, ...subParams, ...qParams]);
      return { rows, total };
    }
    case "deployments": {
      const total = await countRows("Deployment", isAdmin ? undefined : company);
      const rows = await selectAll(`SELECT * FROM "Deployment" ${where} ORDER BY "date" DESC, "createdAt" DESC${limitClause}`, qParams);
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
      const res = await runInsert(
        `INSERT INTO "TestPlan" ("company", "publicToken", "title", "project", "sprint", "scope", "status", "startDate", "endDate", "notes", "assignee")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.publicToken || makePublicToken(), data.title, data.project, data.sprint, data.scope, data.status, data.startDate, data.endDate, data.notes ?? "", data.assignee ?? ""]
      );
      await logActivity(company, "TestPlan", String(data.title), "Created", `New test plan: ${data.title}`);
      invalidateDashboardCache(company);
      await syncSprintFromTestPlan({ company, sprintName: data.sprint, startDate: data.startDate, endDate: data.endDate, goal: data.title });
      return res;
    }
    case "test-cases": {
      const res = await runInsert(
        `INSERT INTO "TestCase" ("company", "publicToken", "testSuiteId", "tcId", "typeCase", "preCondition", "caseName", "testStep", "expectedResult", "actualResult", "status", "evidence", "priority")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.publicToken || makePublicToken(), data.testSuiteId, data.tcId, data.typeCase, data.preCondition, data.caseName, data.testStep, data.expectedResult, data.actualResult ?? "", data.status, data.evidence ?? "", data.priority ?? "Medium"]
      );
      await logActivity(company, "TestCase", String(data.tcId), "Created", `Added test case: ${data.tcId} - ${data.caseName}`);
      invalidateDashboardCache(company);
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
      return res;
    }
    case "tasks": {
      const res = await runInsert(
        `INSERT INTO "Task" ("company", "title", "project", "relatedFeature", "category", "status", "priority", "dueDate", "description", "notes", "evidence", "relatedItems", "assignee")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.notes, data.evidence, data.relatedItems, data.assignee ?? ""],
      );
      await logActivity(company, "Task", String(data.title), "Created", `New task assigned: ${data.title}`);
      invalidateDashboardCache(company);
      return res;
    }
    case "test-sessions": {
      const res = await runInsert(
        `INSERT INTO "TestSession" ("company", "date", "project", "sprint", "tester", "scope", "totalCases", "passed", "failed", "blocked", "result", "notes", "evidence")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.date, data.project, data.sprint, data.tester, data.scope, data.totalCases, data.passed, data.failed, data.blocked, data.result, data.notes, data.evidence]
      );
      await logActivity(company, "Session", data.date, "Executed", `Test execution session by ${data.tester} (${data.result})`);
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
      const { hashPassword } = await import("@/lib/auth-core");
      const hashedPassword = await hashPassword(data.password || "password123");
      const res = await runInsert(
        `INSERT INTO "User" ("company", "name", "username", "password", "role")
         VALUES (?, ?, ?, ?, ?)`,
        [company, data.name || data.username, data.username, hashedPassword, data.role || "user"]
      );
      await logActivity(company, "User", String(data.username), "Created", `Access granted for ${data.username}`);
      invalidateDashboardCache(company);
      return res;
    }
    case "sprints": {
      const res = await runInsert(
        `INSERT INTO "Sprint" ("company", "name", "startDate", "endDate", "status", "goal")
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company, data.name, data.startDate, data.endDate, data.status, data.goal ?? ""]
      );
      await logActivity(company, "Sprint", String(data.name), "Created", `Sprint ${data.name} started`);
      invalidateDashboardCache(company);
      return res;
    }
    case "meeting-notes": {
      const res = await runInsert(
        `INSERT INTO "MeetingNote" ("company", "publicToken", "date", "project", "title", "attendees", "content", "actionItems")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.publicToken || makePublicToken(), data.date || new Date().toISOString(), data.project, data.title, data.attendees ?? "", data.content ?? "", data.actionItems ?? ""]
      );
      await logActivity(company, "MeetingNote", String(data.title), "Created", `Notes recorded for: ${data.title}`);
      invalidateDashboardCache(company);
      return res;
    }
    case "deployments": {
      const res = await runInsert(
        `INSERT INTO "Deployment" ("company", "date", "version", "project", "environment", "developer", "changelog", "status", "notes")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.date, data.version, data.project, data.environment, data.developer, data.changelog ?? "", data.status, data.notes ?? ""]
      );
      await logActivity(company, "Deployment", String(data.version), "Deployed", `Deployment ${data.version} to ${data.environment}: ${data.status}`);
      invalidateDashboardCache(company);
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
         SET "title" = ?, "project" = ?, "relatedFeature" = ?, "category" = ?, "status" = ?, "priority" = ?, "dueDate" = ?, "description" = ?, "notes" = ?, "evidence" = ?, "relatedItems" = ?, "assignee" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.notes, data.evidence, data.relatedItems, data.assignee ?? "", id, ...companyParam]
      );
      await logActivity(company, "Task", String(data.title), "Updated", `Task ${data.title} updated to ${data.status}`);
      invalidateDashboardCache(company);
      return res;
    }
    case "bugs": {
      const res = await db.run(
        `UPDATE "Bug"
         SET "project" = ?, "module" = ?, "bugType" = ?, "title" = ?, "preconditions" = ?, "stepsToReproduce" = ?, "expectedResult" = ?, "actualResult" = ?, "severity" = ?, "priority" = ?, "status" = ?, "evidence" = ?, "relatedItems" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.project, data.module, data.bugType, data.title, data.preconditions, data.stepsToReproduce, data.expectedResult, data.actualResult, data.severity, data.priority, data.status, data.evidence, data.relatedItems, id, ...companyParam]
      );
      await logActivity(company, "Bug", String(data.title), "Updated", `Bug ${data.title} marked as ${data.status}`);
      invalidateDashboardCache(company);
      return res;
    }
    case "test-plans": {
      const res = await db.run(
        `UPDATE "TestPlan"
         SET "title" = ?, "project" = ?, "sprint" = ?, "scope" = ?, "startDate" = ?, "endDate" = ?, "status" = ?, "notes" = ?, "assignee" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.title, data.project, data.sprint, data.scope, data.startDate, data.endDate, data.status, data.notes, data.assignee ?? "", id, ...companyParam]
      );
      await logActivity(company, "TestPlan", String(data.title), "Updated", `Plan ${data.title} revised`);
      invalidateDashboardCache(company);
      await syncSprintFromTestPlan({ company, sprintName: data.sprint, startDate: data.startDate, endDate: data.endDate, goal: data.title });
      return res;
    }
    case "test-sessions": {
      const res = await db.run(
        `UPDATE "TestSession"
         SET "date" = ?, "project" = ?, "sprint" = ?, "tester" = ?, "scope" = ?, "totalCases" = ?, "passed" = ?, "failed" = ?, "blocked" = ?, "result" = ?, "notes" = ?, "evidence" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.date, data.project, data.sprint, data.tester, data.scope, data.totalCases, data.passed, data.failed, data.blocked, data.result, data.notes, data.evidence, id, ...companyParam]
      );
      await logActivity(company, "Session", String(data.date), "Updated", `Test session results updated`);
      return res;
    }
    case "test-cases": {
      const res = await db.run(
        `UPDATE "TestCase"
         SET "testSuiteId" = ?, "tcId" = ?, "typeCase" = ?, "preCondition" = ?, "caseName" = ?, "testStep" = ?, "expectedResult" = ?, "actualResult" = ?, "status" = ?, "evidence" = ?, "priority" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.testSuiteId, data.tcId, data.typeCase, data.preCondition, data.caseName, data.testStep, data.expectedResult, data.actualResult ?? "", data.status, data.evidence ?? "", data.priority ?? "Medium", id, ...companyParam]
      );
      await logActivity(company, "TestCase", String(data.caseName), "Updated", `Test case ${data.caseName} updated`);
      invalidateDashboardCache(company);
      return res;
    }
    case "test-suites": {
      const suitePlanId = String(data.testPlanId ?? "");
      const res = await db.run(
        `UPDATE "TestSuite"
         SET "testPlanId" = ?, "title" = ?, "assignee" = ?, "status" = ?, "notes" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [suitePlanId, data.title, data.assignee ?? "", data.status, data.notes, id, ...companyParam]
      );
      await logActivity(company, "TestSuite", String(data.title), "Updated", `Suite ${data.title} updated`);
      invalidateDashboardCache(company);
      return res;
    }
    case "assignees": {
      const res = await db.run(
        `UPDATE "Assignee"
         SET "name" = ?, "role" = ?, "email" = ?, "skills" = ?, "status" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.name, data.role ?? "", data.email ?? "", data.skills ?? "", data.status, id, ...companyParam]
      );
      await logActivity(company, "Assignee", String(data.name), "Updated", `Profile for ${data.name} updated`);
      invalidateDashboardCache(company);
      return res;
    }
    case "users": {
      const { hashPassword } = await import("@/lib/auth-core");
      if (data.password) {
        const hashedPassword = await hashPassword(data.password);
        const res = await db.run(
          `UPDATE "User" SET "name" = ?, "username" = ?, "role" = ?, "password" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?${companyFilter}`,
          [data.name, data.username, data.role, hashedPassword, id, ...companyParam]
        );
        await logActivity(company, "User", String(data.username), "Updated", `Security settings for ${data.username} updated`);
        invalidateDashboardCache(company);
        return res;
      } else {
        const res = await db.run(
          `UPDATE "User" SET "name" = ?, "username" = ?, "role" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?${companyFilter}`,
          [data.name, data.username, data.role, id, ...companyParam]
        );
        await logActivity(company, "User", String(data.username), "Updated", `User info for ${data.username} updated`);
        invalidateDashboardCache(company);
        return res;
      }
    }
    case "sprints": {
      const res = await db.run(
        `UPDATE "Sprint"
         SET "name" = ?, "startDate" = ?, "endDate" = ?, "status" = ?, "goal" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.name, data.startDate, data.endDate, data.status, data.goal ?? "", id, ...companyParam]
      );
      await logActivity(company, "Sprint", String(data.name), "Updated", `Sprint ${data.name} updated to ${data.status}`);
      invalidateDashboardCache(company);
      return res;
    }
    case "meeting-notes": {
      const res = await db.run(
        `UPDATE "MeetingNote"
         SET "date" = ?, "project" = ?, "title" = ?, "attendees" = ?, "content" = ?, "actionItems" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.date, data.project, data.title, data.attendees ?? "", data.content ?? "", data.actionItems ?? "", id, ...companyParam]
      );
      await logActivity(company, "MeetingNote", String(data.title), "Updated", `Meeting notes for ${data.title} revised`);
      invalidateDashboardCache(company);
      return res;
    }
    case "deployments": {
      const res = await db.run(
        `UPDATE "Deployment"
         SET "date" = ?, "version" = ?, "project" = ?, "environment" = ?, "developer" = ?, "changelog" = ?, "status" = ?, "notes" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.date, data.version, data.project, data.environment, data.developer, data.changelog ?? "", data.status, data.notes ?? "", id, ...companyParam]
      );
      await logActivity(company, "Deployment", String(data.version), "Updated", `Deployment ${data.version} updated to ${data.status}`);
      invalidateDashboardCache(company);
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
  
  if (["TestCase", "TestPlan", "TestSuite", "MeetingNote"].includes(table)) {
    const res = await db.run(`UPDATE "${table}" SET "deletedAt" = CURRENT_TIMESTAMP WHERE id = ?${companyFilter}`, [id, ...companyParam]);
    await logActivity(company, table, entityId, "Deleted", `${table} removed`);
    invalidateDashboardCache(company);
    return res;
  }
  
  const res = await db.run(`DELETE FROM "${table}" WHERE id = ?${companyFilter}`, [id, ...companyParam]);
  await logActivity(company, table, entityId, "Deleted", `${table} permanently deleted`);
  invalidateDashboardCache(company);
  return res;
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

export async function updateModuleStatus(module: ModuleKey, id: string | number, status: string) {
  const { company, andWhere, params: qParams } = getAccessScope(await getCurrentUser());

  const table = getTableName(module);
  if (!table) return null;
  const res = await db.run(`UPDATE "${table}" SET "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?${andWhere}`, [status, id, ...qParams]);
  await logActivity(company, table, String(id), "Status Update", `${table} status updated to ${status}`);
  invalidateDashboardCache(company);
  return res;
}

export async function clearModuleRecords(module: ModuleKey) {
  const { company, where, params } = getAccessScope(await getCurrentUser());

  const table = getTableName(module);
  if (!table) return null;
  const res = await db.run(`DELETE FROM "${table}"${where}`, params);
  await logActivity(company, table, "ALL", "Cleared", `${table} records cleared`);
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
