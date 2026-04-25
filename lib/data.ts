import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { moduleConfigs, type ModuleKey } from "@/lib/modules";
import { randomBytes } from "crypto";

export function makePublicToken() {
  return randomBytes(8).toString("base64url");
}

export function normalizeTestPlanRow(item: Record<string, unknown>) {
  return {
    ...item,
    id: String(item.id ?? ""),
    code: String(item.code && String(item.code).trim() ? item.code : ""),
    publicToken: String(item.publicToken ?? ""),
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

export function getTableName(module: ModuleKey) {
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
    default:
      console.warn(`getTableName: unhandled module key: ${module}`);
      return "";
  }
}

export async function getDashboardData() {
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
    todaySessions
  ] = await Promise.all([
    selectAll('SELECT * FROM "Task" ORDER BY "updatedAt" DESC LIMIT 5'),
    selectAll('SELECT * FROM "Bug" ORDER BY "updatedAt" DESC LIMIT 5'),
    selectAll('SELECT * FROM "TestCase" ORDER BY "updatedAt" DESC LIMIT 5'),
    countRows("Task"),
    countRows("Bug"),
    countRows("TestCase"),
    selectAll('SELECT status, COUNT(*) as count FROM "Task" GROUP BY status'),
    selectAll('SELECT severity, COUNT(*) as count FROM "Bug" GROUP BY severity'),
    db.get("SELECT * FROM \"Sprint\" WHERE status = 'active' LIMIT 1") as Promise<any>,
    db.get("SELECT COUNT(*) as count FROM \"Bug\" WHERE status IN ('fixed', 'closed')") as Promise<any>,
    db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE status = 'completed'") as Promise<any>,
    selectAll(`SELECT DATE("createdAt") as date, COUNT(*) as count FROM "Bug" WHERE "createdAt" >= DATE('now', '-7 days') GROUP BY DATE("createdAt") ORDER BY date ASC`),
    selectAll('SELECT id, name, startDate, endDate, status FROM "Sprint" ORDER BY startDate DESC LIMIT 20'),
    selectAll('SELECT * FROM "ActivityLog" ORDER BY "createdAt" DESC LIMIT 10'),
    selectAll('SELECT module, COUNT(*) as count FROM "Bug" GROUP BY module LIMIT 10'),
    selectAll(`SELECT 'Task' as type, title as label, status FROM "Task" WHERE DATE("updatedAt") = DATE('now')`),
    selectAll(`SELECT 'Bug' as type, title as label, status FROM "Bug" WHERE DATE("updatedAt") = DATE('now')`),
    selectAll(`SELECT 'Session' as type, scope as label, result FROM "TestSession" WHERE DATE("createdAt") = DATE('now')`),
  ]);

  const todayActivity = [...(todayTasks || []), ...(todayBugs || []), ...(todaySessions || [])];

  let sprintInfo = null;
  if (sprint) {
    const [tTotal, tDone] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM "Task" WHERE "sprintId" = ?', [sprint.id]) as Promise<any>,
      db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE \"sprintId\" = ? AND status = 'done'", [sprint.id]) as Promise<any>
    ]);
    
    sprintInfo = {
      name: String(sprint.name),
      startDate: String(sprint.startDate),
      endDate: String(sprint.endDate),
      progress: Number(tTotal.count) > 0 ? Math.round((Number(tDone.count) / Number(tTotal.count)) * 100) : 0,
      taskTotal: Number(tTotal.count),
      taskDone: Number(tDone.count)
    };
  }

  const successRate = (bugCount + taskCount) > 0 ? Math.round(((Number(bugFixed.count) + Number(taskCompleted.count)) / (bugCount + taskCount)) * 100) : 0;

  return {
    metrics: [
      { label: "Open Tasks", value: taskCount, caption: "Daily QA tasks currently being managed." },
      { label: "Bug Entries", value: bugCount, caption: "Defects with severity, priority, and evidence." },
      { label: "Test Cases", value: caseCount, caption: "Positive and negative scenarios ready for use." },
    ],
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
       projectName: taskCount > 0 || bugCount > 0 ? "Active Project" : "No active project",
       projectDescription: "Track and monitor QA progress across modules.",
       totalScenarios: caseCount,
       totalBugs: bugCount,
       completionRate: successRate,
       criticalBugs: [],
       priorityTasks: []
    },
    sprintInfo: sprintInfo ? {
       ...sprintInfo,
       goal: "Complete all planned tasks for the current cycle."
    } : null,
    personalSuccessRate: successRate,
    activity: (activity as Array<Record<string, unknown>>).map((item) => ({
      id: Number(item.id),
      entityType: String(item.entityType ?? ""),
      entityId: String(item.entityId ?? ""),
      action: String(item.action ?? ""),
      summary: String(item.summary ?? ""),
      createdAt: String(item.createdAt ?? ""),
    })),
    bugTrendData: bugTrend.map((r) => ({ date: String(r.date), count: Number(r.count) })),
    sprints: allSprints.map((s) => ({
      id: Number(s.id),
      name: String(s.name),
      startDate: String(s.startDate),
      endDate: String(s.endDate),
      status: String(s.status),
    })),
  };
}

export async function getReportsData() {
  const [bugSeverity, bugStatus, testCaseStatus, bugTrend] = await Promise.all([
    selectAll('SELECT severity as name, COUNT(*) as value FROM "Bug" GROUP BY severity'),
    selectAll('SELECT status as name, COUNT(*) as value FROM "Bug" GROUP BY status'),
    selectAll('SELECT status as name, COUNT(*) as value FROM "TestCase" GROUP BY status'),
    selectAll(`SELECT DATE("createdAt") as date, COUNT(*) as count FROM "Bug" GROUP BY DATE("createdAt") ORDER BY date ASC`),
  ]);

  return {
    bugSeverityData: bugSeverity.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    bugStatusData: bugStatus.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    testCaseStatusData: testCaseStatus.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    bugTrendData: bugTrend.map((row) => ({ date: String(row.date), count: Number(row.count) })),
  };
}

export async function getExecutiveData() {
  const [critRes, totalBugs, openT, tcPass, testCaseTotal] = await Promise.all([
    db.get("SELECT COUNT(*) as count FROM \"Bug\" WHERE severity IN ('critical', 'high', 'P0', 'P1') AND status != 'closed'") as Promise<any>,
    countRows("Bug"),
    db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE status != 'done'") as Promise<any>,
    db.get("SELECT COUNT(*) as count FROM \"TestCase\" WHERE status IN ('Passed', 'Success')") as Promise<any>,
    countRows("TestCase"),
  ]);

  const criticalBugs = Number(critRes.count);
  const openTasks = Number(openT.count);
  const testCasePass = Number(tcPass.count);
  
  const readiness = testCaseTotal > 0 ? Math.round((testCasePass / testCaseTotal) * 100) : 0;
  const bugDensity = totalBugs > 0 ? (criticalBugs / totalBugs).toFixed(2) : 0;

  const metrics = [
    { label: "Critical Defects", value: criticalBugs, trend: "down", status: criticalBugs > 5 ? "danger" : "warning" },
    { label: "Release Readiness", value: readiness + "%", trend: "up", status: readiness > 90 ? "success" : "warning" },
    { label: "Risk Factor", value: bugDensity, trend: "stable", status: Number(bugDensity) > 0.2 ? "danger" : "success" },
    { label: "Blockers", value: openTasks, trend: "down", status: openTasks > 10 ? "warning" : "success" },
  ];

  const [trend, notes, totalTasks, fBugs, cTasks] = await Promise.all([
    getQualityTrend(),
    getReleaseNotes(),
    countRows("Task"),
    db.get("SELECT COUNT(*) as count FROM \"Bug\" WHERE status IN ('fixed', 'closed')") as Promise<any>,
    db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE status = 'completed'") as Promise<any>
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
      planName: (await db.get('SELECT title FROM "TestPlan" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC LIMIT 1') as any)?.title || "Master Test Strategy",
      projectName: (await db.get('SELECT project FROM "TestPlan" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC LIMIT 1') as any)?.project || "All Active Projects"
    }
  };
}

export async function getModuleRows(module: ModuleKey) {
  switch (module) {
    case "test-plans":
      return (await selectAll('SELECT * FROM "TestPlan" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC')).map((item, index) => {
        const normalized = normalizeTestPlanRow(item);
        return {
          ...normalized,
          code: codeFromId("PLAN", index + 1),
          publicToken: normalized.publicToken || "",
        };
      });
    case "test-sessions":
      return await selectAll('SELECT * FROM "TestSession" ORDER BY "updatedAt" DESC');
    case "test-cases":
      return (await selectAll('SELECT * FROM "TestCase" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC')).map((item) => normalizeTestCaseRow(item));
    case "bugs":
      return await selectAll('SELECT * FROM "Bug" ORDER BY "updatedAt" DESC');
    case "tasks":
      return await selectAll('SELECT * FROM "Task" ORDER BY "updatedAt" DESC');
    case "test-suites":
      return (await selectAll('SELECT * FROM "TestSuite" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC')).map((item, index) => ({
        ...normalizeTestSuiteRow(item),
        code: codeFromId("SUITE", index + 1),
      }));
    case "meeting-notes":
      return (await selectAll('SELECT * FROM "MeetingNote" WHERE "deletedAt" IS NULL ORDER BY "date" DESC, "updatedAt" DESC')).map((item, index) => ({
        ...item,
        code: codeFromId("MEET", index + 1),
      }));
    default:
      return [];
  }
}

export async function createModuleRecord(module: ModuleKey, data: any) {
  switch (module) {
    case "test-plans": {
      return await runInsert(
        `INSERT INTO "TestPlan" ("publicToken", title, project, sprint, scope, status, "startDate", "endDate", notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.publicToken || makePublicToken(), data.title, data.project, data.sprint, data.scope, data.status, data.startDate, data.endDate, data.notes ?? ""]
      );
    }
    case "test-cases":
      return await runInsert(
        `INSERT INTO "TestCase" ("publicToken", "testSuiteId", "tcId", "typeCase", "preCondition", "caseName", "testStep", "expectedResult", "actualResult", status, evidence, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.publicToken || makePublicToken(), data.testSuiteId, data.tcId, data.typeCase, data.preCondition, data.caseName, data.testStep, data.expectedResult, data.actualResult ?? "", data.status, data.evidence ?? "", data.priority ?? "Medium"]
      );
    case "bugs":
      const lastDev = await db.get('SELECT suggestedDev FROM "Bug" WHERE module = ? ORDER BY id DESC LIMIT 1', [data.module]) as any;
      const suggestedDev = lastDev?.suggestedDev || "";
      return await runInsert(
        `INSERT INTO "Bug" (project, module, "bugType", title, preconditions, "stepsToReproduce", "expectedResult", "actualResult", severity, priority, status, evidence, "relatedItems", "suggestedDev")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.project, data.module, data.bugType, data.title, data.preconditions, data.stepsToReproduce, data.expectedResult, data.actualResult, data.severity, data.priority, data.status, data.evidence, data.relatedItems, suggestedDev],
      );
    case "tasks":
      return await runInsert(
        `INSERT INTO "Task" (title, project, "relatedFeature", category, status, priority, "dueDate", description, notes, evidence, "relatedItems")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.notes, data.evidence, data.relatedItems],
      );
    case "test-sessions":
      return await runInsert(
        `INSERT INTO "TestSession" (date, project, sprint, tester, scope, totalCases, passed, failed, blocked, result, notes, evidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.date, data.project, data.sprint, data.tester, data.scope, data.totalCases, data.passed, data.failed, data.blocked, data.result, data.notes, data.evidence]
      );
    case "test-suites":
      return await runInsert(
        `INSERT INTO "TestSuite" ("publicToken", "testPlanId", title, assignee, status, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.publicToken || makePublicToken(), data.testPlanId, data.title, data.assignee ?? "", data.status, data.notes ?? ""]
      );
    default:
      return null;
  }
}

export async function updateModuleRecord(module: ModuleKey, id: string | number, data: any) {
  switch (module) {
    case "tasks":
      return await db.run(
        `UPDATE "Task"
         SET title = ?, project = ?, "relatedFeature" = ?, category = ?, status = ?, priority = ?, "dueDate" = ?, description = ?, notes = ?, evidence = ?, "relatedItems" = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.notes, data.evidence, data.relatedItems, id]
      );
    case "bugs":
      return await db.run(
        `UPDATE "Bug"
         SET project = ?, module = ?, "bugType" = ?, title = ?, preconditions = ?, "stepsToReproduce" = ?, "expectedResult" = ?, "actualResult" = ?, severity = ?, priority = ?, status = ?, evidence = ?, "relatedItems" = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.project, data.module, data.bugType, data.title, data.preconditions, data.stepsToReproduce, data.expectedResult, data.actualResult, data.severity, data.priority, data.status, data.evidence, data.relatedItems, id]
      );
    case "test-plans":
      return await db.run(
        `UPDATE "TestPlan"
         SET title = ?, project = ?, sprint = ?, scope = ?, startDate = ?, endDate = ?, status = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.title, data.project, data.sprint, data.scope, data.startDate, data.endDate, data.status, data.notes, id]
      );
    case "test-sessions":
      return await db.run(
        `UPDATE "TestSession"
         SET date = ?, project = ?, sprint = ?, tester = ?, scope = ?, totalCases = ?, passed = ?, failed = ?, blocked = ?, result = ?, notes = ?, evidence = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.date, data.project, data.sprint, data.tester, data.scope, data.totalCases, data.passed, data.failed, data.blocked, data.result, data.notes, data.evidence, id]
      );
    case "test-cases":
      return await db.run(
        `UPDATE "TestCase"
         SET "testSuiteId" = ?, "tcId" = ?, "typeCase" = ?, "preCondition" = ?, "caseName" = ?, "testStep" = ?, "expectedResult" = ?, "actualResult" = ?, status = ?, evidence = ?, priority = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.testSuiteId, data.tcId, data.typeCase, data.preCondition, data.caseName, data.testStep, data.expectedResult, data.actualResult ?? "", data.status, data.evidence ?? "", data.priority ?? "Medium", id]
      );
    case "test-suites":
      const suitePlanId = String(data.testPlanId ?? "");
      return await db.run(
        `UPDATE "TestSuite"
         SET "testPlanId" = ?, title = ?, assignee = ?, status = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [suitePlanId, data.title, data.assignee ?? "", data.status, data.notes, id]
      );
    default:
      return null;
  }
}

export async function deleteModuleRecord(module: ModuleKey, id: string | number) {
  const table = getTableName(module);
  if (!table) return null;
  
  if (["TestCase", "TestPlan", "TestSuite"].includes(table)) {
    return await db.run(`UPDATE "${table}" SET "deletedAt" = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
  }
  
  return await db.run(`DELETE FROM "${table}" WHERE id = ?`, [id]);
}

export async function getTestPlanByToken(token: string) {
  const item = await db.get(
    'SELECT * FROM "TestPlan" WHERE ("publicToken" = ? OR CAST(id AS TEXT) = ?) AND "deletedAt" IS NULL',
    [token, token],
  ) as Record<string, unknown> | undefined;
  if (!item) return null;
  return normalizeTestPlanRow(item);
}

export async function getTestSuitesByPlanId(planId: string) {
  const rows = await selectAll('SELECT * FROM "TestSuite" WHERE "testPlanId" = ? AND "deletedAt" IS NULL ORDER BY "updatedAt" DESC', [planId]);
  return rows.map(item => normalizeTestSuiteRow(item));
}

export async function getReleaseNotes() {
  const bugs = await selectAll('SELECT * FROM "Bug" WHERE status IN (\'fixed\', \'closed\') ORDER BY "updatedAt" DESC LIMIT 20');
  const tasks = await selectAll('SELECT * FROM "Task" WHERE status = \'completed\' ORDER BY "updatedAt" DESC LIMIT 20');
  
  return {
    fixedBugs: bugs.map(b => ({ code: codeFromId("BUG", Number(b.id)), title: b.title, severity: b.severity })),
    completedTasks: tasks.map(t => ({ code: codeFromId("TASK", Number(t.id)), title: t.title }))
  };
}

export async function getQualityTrend() {
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (i * 7));
    const start = new Date(d);
    start.setDate(start.getDate() - 7);
    weeks.push({
      label: `Week -${i}`,
      start: start.toISOString(),
      end: d.toISOString()
    });
  }

  const trend = [];
  for(const w of weeks.reverse()) {
    const bugsRes = await db.get('SELECT COUNT(*) as count FROM "Bug" WHERE "createdAt" BETWEEN ? AND ?', [w.start, w.end]) as any;
    const fixedRes = await db.get('SELECT COUNT(*) as count FROM "Bug" WHERE status = \'fixed\' AND "updatedAt" BETWEEN ? AND ?', [w.start, w.end]) as any;
    trend.push({
      label: w.label,
      bugs: Number(bugsRes.count),
      fixed: Number(fixedRes.count)
    });
  }
  return trend;
}

export async function getTestSuite(id: string | number) {
  const item = await db.get('SELECT * FROM "TestSuite" WHERE id = ? AND "deletedAt" IS NULL', [id]) as Record<string, unknown> | undefined;
  if (!item) return null;
  return { ...item, code: codeFromId("SUITE", Number(id)) };
}

export async function getTestCasesByIdStrings(idStrings: string) {
  if (!idStrings.trim()) return [];
  const rows = await selectAll(
    'SELECT * FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL ORDER BY "id" ASC',
    [idStrings.trim()],
  );
  return rows.map((r) => ({ ...normalizeTestCaseRow(r), code: codeFromId("TC", Number(r.id)) }));
}


export async function getProjectData(projectName: string) {
  const [plans, bugs, tasks, sessions, meetings] = await Promise.all([
    selectAll('SELECT * FROM "TestPlan" WHERE project = ? AND "deletedAt" IS NULL', [projectName]),
    selectAll('SELECT * FROM "Bug" WHERE project = ?', [projectName]),
    selectAll('SELECT * FROM "Task" WHERE project = ?', [projectName]),
    selectAll('SELECT * FROM "TestSession" WHERE project = ?', [projectName]),
    selectAll('SELECT * FROM "MeetingNote" WHERE project = ? AND "deletedAt" IS NULL ORDER BY "date" DESC', [projectName]),
  ]);

  // For stats, we need suites and cases too
  const planIds = plans.map(p => String(p.id));
  let suites: any[] = [];
  if (planIds.length > 0) {
    const placeholders = planIds.map(() => '?').join(',');
    suites = await selectAll(`SELECT * FROM "TestSuite" WHERE testPlanId IN (${placeholders}) AND "deletedAt" IS NULL`, planIds);
  }

  const suiteIds = suites.map(s => String(s.id));
  let cases: any[] = [];
  if (suiteIds.length > 0) {
    const placeholders = suiteIds.map(() => '?').join(',');
    cases = await selectAll(`SELECT * FROM "TestCase" WHERE testSuiteId IN (${placeholders}) AND "deletedAt" IS NULL`, suiteIds);
  }

  const totalCases = cases.length;
  const passed = cases.filter(c => String(c.status).toLowerCase() === 'passed').length;
  const failed = cases.filter(c => String(c.status).toLowerCase() === 'failed').length;

  return {
    projectName,
    plans: plans.map(normalizeTestPlanRow),
    bugs: bugs.map(b => ({ ...b, code: codeFromId('BUG', Number(b.id)) })),
    tasks: tasks.map(t => ({ ...t, code: codeFromId('TASK', Number(t.id)) })),
    sessions: sessions.map(s => ({ ...s, code: codeFromId('SES', Number(s.id)) })),
    meetings: meetings.map(m => ({ ...m, code: codeFromId('MEET', Number(m.id)) })),
    stats: {
      totalPlans: plans.length,
      totalBugs: bugs.length,
      totalTasks: tasks.length,
      totalCases,
      passed,
      failed,
      successRate: totalCases > 0 ? Math.round((passed / totalCases) * 100) : 0
    }
  };
}

async function countRows(table: string) {
  const result = await db.get(`SELECT COUNT(*) as total FROM "${table}"`) as { total: number };
  return Number(result?.total || 0);
}

async function selectAll(sqlStr: string, params: any[] = []) {
  return await db.query(sqlStr, params) as Array<Record<string, string | number | null>>;
}

async function runInsert(sqlStr: string, params: any[]) {
  return await db.run(sqlStr, params);
}

export async function getTestSuiteByToken(token: string) {
  return await db.get('SELECT * FROM "TestSuite" WHERE "publicToken" = ? AND "deletedAt" IS NULL', [token]) as Record<string, unknown> | undefined;
}

export async function getTestCasesByScenario(suiteId: string | number) {
  return await selectAll('SELECT * FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL ORDER BY id ASC', [suiteId]);
}

export async function updateModuleStatus(module: ModuleKey, id: string | number, status: string) {
  const table = getTableName(module);
  if (!table) return null;
  return await db.run(`UPDATE "${table}" SET status = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
}

export async function clearModuleRecords(module: ModuleKey) {
  const table = getTableName(module);
  if (!table) return null;
  return await db.run(`DELETE FROM "${table}"`);
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
