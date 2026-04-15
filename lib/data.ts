import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { moduleConfigs, type ModuleKey } from "@/lib/modules";

export async function getDashboardData() {
  const tasks = await selectAll('SELECT * FROM "Task" ORDER BY "updatedAt" DESC LIMIT 5');
  const bugs = await selectAll('SELECT * FROM "Bug" ORDER BY "updatedAt" DESC LIMIT 5');
  const testCases = await selectAll('SELECT * FROM "TestCaseScenario" ORDER BY "updatedAt" DESC LIMIT 5');
  const meetings = await selectAll('SELECT * FROM "MeetingNote" ORDER BY "date" DESC LIMIT 3');
  const logs = await selectAll('SELECT * FROM "DailyLog" ORDER BY "date" DESC LIMIT 3');

  const taskCount = await countRows("Task");
  const bugCount = await countRows("Bug");
  const caseCount = await countRows("TestCaseScenario");
  const meetingCount = await countRows("MeetingNote");
  const logCount = await countRows("DailyLog");

  const taskStatus = await selectAll('SELECT status, COUNT(*) as count FROM "Task" GROUP BY status');
  const bugSeverity = await selectAll('SELECT severity, COUNT(*) as count FROM "Bug" GROUP BY severity');

  const sprint = await db.get("SELECT * FROM \"Sprint\" WHERE status = 'active' LIMIT 1") as any;
  let sprintInfo = null;
  if (sprint) {
    const tTotal = await db.get('SELECT COUNT(*) as count FROM "Task" WHERE "sprintId" = ?', [sprint.id]) as any;
    const tDone = await db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE \"sprintId\" = ? AND status = 'done'", [sprint.id]) as any;
    sprintInfo = {
      name: String(sprint.name),
      startDate: String(sprint.startDate),
      endDate: String(sprint.endDate),
      progress: Number(tTotal.count) > 0 ? Math.round((Number(tDone.count) / Number(tTotal.count)) * 100) : 0,
      taskTotal: Number(tTotal.count),
      taskDone: Number(tDone.count)
    };
  }

  const bugFixed = await db.get("SELECT COUNT(*) as count FROM \"Bug\" WHERE status IN ('fixed', 'closed')") as any;
  const taskCompleted = await db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE status = 'completed'") as any;
  const totalB = await db.get('SELECT COUNT(*) as count FROM "Bug"') as any;
  const totalT = await db.get('SELECT COUNT(*) as count FROM "Task"') as any;
  const totalActions = Number(totalB.count) + Number(totalT.count);
  const totalSuccess = Number(bugFixed.count) + Number(taskCompleted.count);
  const successRate = totalActions > 0 ? Math.round((totalSuccess / totalActions) * 100) : 100;

  return {
    metrics: [
      { label: "Open Tasks", value: taskCount, caption: "Daily QA tasks currently being managed." },
      { label: "Bug Entries", value: bugCount, caption: "Defects with severity, priority, and evidence." },
      { label: "Test Cases", value: caseCount, caption: "Positive and negative scenarios ready for use." },
      { label: "Meeting Notes", value: meetingCount, caption: "Decision logs and meeting action items." },
      { label: "Daily Logs", value: logCount, caption: "Daily testing summaries and blockers." },
    ],
    distribution: {
      tasks: taskStatus.map(r => ({ name: String(r.status), value: Number(r.count) })),
      bugs: bugSeverity.map(r => ({ name: String(r.severity), value: Number(r.count) })),
    },
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
        id: String(item.id),
        code: `TCS-${String(item.id).substring(0, 8)}`,
        title: String(item.moduleName ?? ""),
        priority: "N/A",
        status: String(item.projectName ?? ""),
      })),
      meetings: meetings.map((item) => ({
        id: Number(item.id),
        code: codeFromId("MTG", Number(item.id)),
        title: String(item.title ?? ""),
        date: String(item.date ?? ""),
      })),
      logs: logs.map((item) => ({
        id: Number(item.id),
        code: codeFromId("LOG", Number(item.id)),
        project: String(item.project ?? ""),
        date: String(item.date ?? ""),
      })),
    },
    spotlight: {
       projectName: taskCount > 0 || bugCount > 0 ? "Active Project" : "No active project",
       totalScenarios: caseCount,
       totalBugs: bugCount,
       completionRate: successRate,
       criticalBugs: [],
       priorityTasks: []
    },
    sprintInfo,
    personalSuccessRate: successRate
  };
}

export async function getReportsData() {
  const bugSeverity = await selectAll('SELECT severity as name, COUNT(*) as value FROM "Bug" GROUP BY severity');
  const bugStatus = await selectAll('SELECT status as name, COUNT(*) as value FROM "Bug" GROUP BY status');
  const testCaseStatus = await selectAll('SELECT status as name, COUNT(*) as value FROM "TestCase" GROUP BY status');
  
  const bugTrend = await selectAll(`
    SELECT DATE("createdAt") as date, COUNT(*) as count 
    FROM "Bug" 
    GROUP BY DATE("createdAt") 
    ORDER BY date ASC
  `);

  return {
    bugSeverityData: bugSeverity.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    bugStatusData: bugStatus.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    testCaseStatusData: testCaseStatus.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    bugTrendData: bugTrend.map((row) => ({ date: String(row.date), count: Number(row.count) })),
  };
}

export async function getExecutiveData() {
  const critRes = await db.get("SELECT COUNT(*) as count FROM \"Bug\" WHERE severity IN ('critical', 'high') AND status != 'closed'") as any;
  const criticalBugs = Number(critRes.count);
  const totalBugs = await countRows("Bug");
  const openT = await db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE status != 'done'") as any;
  const openTasks = Number(openT.count);
  const tcPass = await db.get("SELECT COUNT(*) as count FROM \"TestCase\" WHERE status = 'Success'") as any;
  const testCasePass = Number(tcPass.count);
  const testCaseTotal = await countRows("TestCase");
  
  const readiness = testCaseTotal > 0 ? Math.round((testCasePass / testCaseTotal) * 100) : 0;
  const bugDensity = totalBugs > 0 ? (criticalBugs / totalBugs).toFixed(2) : 0;

  const metrics = [
    { label: "Critical Defects", value: criticalBugs, trend: "down", status: criticalBugs > 5 ? "danger" : "warning" },
    { label: "Release Readiness", value: readiness + "%", trend: "up", status: readiness > 90 ? "success" : "warning" },
    { label: "Risk Factor", value: bugDensity, trend: "stable", status: Number(bugDensity) > 0.2 ? "danger" : "success" },
    { label: "Blockers", value: openTasks, trend: "down", status: openTasks > 10 ? "warning" : "success" },
  ];

  const trend = await getQualityTrend();
  const notes = await getReleaseNotes();

  const totalTasks = await countRows("Task");
  const fBugs = await db.get("SELECT COUNT(*) as count FROM \"Bug\" WHERE status IN ('fixed', 'closed')") as any;
  const fixedBugs = Number(fBugs.count);
  const cTasks = await db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE status = 'completed'") as any;
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
    }
  };
}

export async function getModuleRows(module: ModuleKey) {
  switch (module) {
    case "test-plans":
      return await selectAll('SELECT * FROM "TestPlan" ORDER BY "updatedAt" DESC');
    case "test-sessions":
      return await selectAll('SELECT * FROM "TestSession" ORDER BY "updatedAt" DESC');
    case "test-cases":
      return await selectAll('SELECT * FROM "TestCaseScenario" ORDER BY "updatedAt" DESC');
    case "bugs":
      return await selectAll('SELECT * FROM "Bug" ORDER BY "updatedAt" DESC');
    case "tasks":
      return await selectAll('SELECT * FROM "Task" ORDER BY "updatedAt" DESC');
    case "meeting-notes":
      return await selectAll('SELECT * FROM "MeetingNote" ORDER BY "updatedAt" DESC');
    case "daily-logs":
      return await selectAll('SELECT * FROM "DailyLog" ORDER BY "updatedAt" DESC');
    case "api-inventory":
      return await selectAll('SELECT * FROM "ApiEndpoint" ORDER BY "updatedAt" DESC');
    case "workload":
      return await selectAll('SELECT * FROM "WorkloadAssignment" ORDER BY "updatedAt" DESC');
    case "env-config":
      return await selectAll('SELECT * FROM "EnvConfig" ORDER BY "updatedAt" DESC');
    case "test-suites":
      return (await selectAll('SELECT * FROM "TestSuite" ORDER BY "updatedAt" DESC')).map((item) => ({
        ...item,
        code: codeFromId("SUITE", Number(item.id)),
      }));
    case "sql-snippets":
      return (await selectAll('SELECT * FROM "SqlSnippet" ORDER BY "updatedAt" DESC')).map((item) => ({
        ...item,
        code: codeFromId("SQL", Number(item.id)),
      }));
    case "testing-assets":
      return (await selectAll('SELECT * FROM "TestingAsset" ORDER BY "updatedAt" DESC')).map((item) => ({
        ...item,
        code: codeFromId("ASSET", Number(item.id)),
      }));
    default:
      return [];
  }
}

export async function createModuleRecord(module: ModuleKey, data: any) {
  switch (module) {
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
    case "workload":
      return await runInsert(
        `INSERT INTO "WorkloadAssignment" (qaName, project, sprint, tasks, status)
         VALUES (?, ?, ?, ?, ?)`,
        [data.qaName, data.project, data.sprint, data.tasks, data.status]
      );
    case "performance":
      return await runInsert(
        `INSERT INTO "PerformanceBenchmark" (date, title, targetUrl, loadTime, score, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.date, data.title, data.targetUrl, data.loadTime, data.score, data.notes]
      );
    case "env-config":
      return await runInsert(
        `INSERT INTO "EnvConfig" (envName, label, url, username, password, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.envName, data.label, data.url, data.username, data.password, data.notes]
      );
    case "test-plans":
      return await runInsert(
        `INSERT INTO "TestPlan" (title, project, sprint, scope, startDate, endDate, assignee, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.title, data.project, data.sprint, data.scope, data.startDate, data.endDate, data.assignee, data.status, data.notes]
      );
    case "test-sessions":
      return await runInsert(
        `INSERT INTO "TestSession" (date, project, sprint, tester, scope, totalCases, passed, failed, blocked, result, notes, evidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.date, data.project, data.sprint, data.tester, data.scope, data.totalCases, data.passed, data.failed, data.blocked, data.result, data.notes, data.evidence]
      );
    case "checklists":
      return await runInsert(
        `INSERT INTO "Checklist" (title, type, items, notes)
         VALUES (?, ?, ?, ?)`,
        [data.title, data.type, data.items, data.notes]
      );
    case "test-suites":
      return await runInsert(
        `INSERT INTO "TestSuite" (title, project, "caseIds", status, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [data.title, data.project, data.caseIds, data.status, data.notes],
      );
    case "sql-snippets":
      return await runInsert(
        `INSERT INTO "SqlSnippet" ("title","project","query","notes")
         VALUES (?, ?, ?, ?)`,
        [data.title, data.project, data.query, data.notes],
      );
    case "testing-assets":
      return await runInsert(
        `INSERT INTO "TestingAsset" ("title","project","url","type","notes")
         VALUES (?, ?, ?, ?, ?)`,
        [data.title, data.project, data.url, data.type, data.notes],
      );
  }
}

export async function updateModuleRecord(module: ModuleKey, id: string | number, data: any) {
  switch (module) {
     case "sql-snippets":
      return await db.run(
        `UPDATE "SqlSnippet"
         SET "title" = ?, "project" = ?, "query" = ?, "notes" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?`,
        [data.title, data.project, data.query, data.notes, id]
      );
      // ... other modules simplified for now
  }
}

export async function updateModuleStatus(module: ModuleKey, id: string | number, status: string) {
  let tableName = module.charAt(0).toUpperCase() + module.slice(1).replace(/-/g, '');
  if(module === 'tasks') tableName = 'Task';
  if(module === 'bugs') tableName = 'Bug';
  if(module === 'test-cases') tableName = 'TestCaseScenario';
  
  return await db.run(`UPDATE "${tableName}" SET status = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
}

export async function clearModuleRecords(module: ModuleKey) {
  const table = module.charAt(0).toUpperCase() + module.slice(1).replace(/-/g, '');
  let tableName = table;
  if(module === 'test-cases') tableName = 'TestCaseScenario';
  if(module === 'api-inventory') tableName = 'ApiEndpoint';
  if(module === 'env-config') tableName = 'EnvConfig';
  if(module === 'test-suites') tableName = 'TestSuite';
  if(module === 'sql-snippets') tableName = 'SqlSnippet';
  if(module === 'testing-assets') tableName = 'TestingAsset';

  return await db.run(`DELETE FROM "${tableName}"`);
}

export async function replaceModuleRecords(module: ModuleKey, rows: any[]) {
  for (const row of rows) {
    await createModuleRecord(module, row);
  }
}

export async function getTestCaseScenario(id: string) {
  return await db.get('SELECT * FROM "TestCaseScenario" WHERE id = ?', [id]);
}

export async function getTestCasesByScenario(scenarioId: string) {
  return await db.query('SELECT * FROM "TestCase" WHERE scenarioId = ? ORDER BY id ASC', [scenarioId]);
}

export async function updateTestCase(id: number, data: any) {
  const query = `
    UPDATE "TestCase" 
    SET preCondition = ?, caseName = ?, testStep = ?, expectedResult = ?, actualResult = ?, status = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  return await db.run(query, [data.preCondition, data.caseName, data.testStep, data.expectedResult, data.actualResult, data.status, id]);
}

export async function deleteModuleRecord(module: ModuleKey, id: string | number) {
  const table = module.charAt(0).toUpperCase() + module.slice(1).replace(/-/g, '');
  // Manual mapping for special tables
  let tableName = table;
  if(module === 'test-cases') tableName = 'TestCaseScenario';
  if(module === 'api-inventory') tableName = 'ApiEndpoint';
  if(module === 'env-config') tableName = 'EnvConfig';
  if(module === 'test-suites') tableName = 'TestSuite';
  if(module === 'sql-snippets') tableName = 'SqlSnippet';
  if(module === 'testing-assets') tableName = 'TestingAsset';

  return await db.run(`DELETE FROM "${tableName}" WHERE id = ?`, [id]);
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
  const item = await db.get('SELECT * FROM "TestSuite" WHERE id = ?', [id]) as Record<string, unknown> | undefined;
  if (!item) return null;
  return { ...item, code: codeFromId("SUITE", Number(id)) };
}

export async function getTestCasesByIdStrings(idStrings: string) {
  const ids = idStrings.split(/[\\s,]+/).map(s => s.trim().replace(/^TC-/, "")).filter(s => s !== "");
  if (ids.length === 0) return [];
  const query = `SELECT * FROM "TestCase" WHERE "id" IN (${ids.map(() => "?").join(",")}) ORDER BY "id" ASC`;
  const rows = await selectAll(query, ids);
  return rows.map(r => ({ ...r, code: codeFromId("TC", Number(r.id)) }));
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

export async function getModuleSheetRows(module: ModuleKey) {
  const rows = await getModuleRows(module);
  return rows.map((row) => moduleConfigs[module].toRow(row as Record<string, unknown>));
}
