import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { moduleConfigs, type ModuleKey } from "@/lib/modules";

export function normalizeTestCaseScenarioRow(item: Record<string, unknown>) {
  const id = String(item.id ?? "");
  const projectName = String(item.projectName ?? item.projectname ?? "");
  const moduleName = String(item.moduleName ?? item.modulename ?? "");
  const referenceDocument = String(item.referenceDocument ?? item.referencedocument ?? "");
  const traceability = String(item.traceability ?? "");
  const createdBy = String(item.createdBy ?? item.createdby ?? "");

  return {
    ...item,
    id,
    projectName,
    moduleName,
    referenceDocument,
    traceability,
    createdBy,
    code: `${projectName.slice(0, 8)} / ${moduleName}`,
  };
}

export function normalizeTestPlanRow(item: Record<string, unknown>) {
  return {
    ...item,
    id: String(item.id ?? ""),
    code: String(item.code ?? ""),
  };
}

export function normalizeTestSuiteRow(item: Record<string, unknown>) {
  return {
    ...item,
    id: String(item.id ?? ""),
    testPlanId: String(item.testPlanId ?? ""),
    title: String(item.title ?? ""),
    status: String(item.status ?? ""),
  };
}

export function normalizeTestCaseRow(item: Record<string, unknown>) {
  return {
    ...item,
    id: Number(item.id ?? 0),
    testSuiteId: String(item.testSuiteId ?? item.scenarioId ?? ""),
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
    case "api-testing":
      return "ApiEndpoint";
    case "env-config":
      return "EnvConfig";
    case "workload":
      return "WorkloadAssignment";
    case "performance":
      return "PerformanceBenchmark";
    case "meeting-notes":
      return "MeetingNote";
    case "daily-logs":
      return "DailyLog";
    case "sql-snippets":
      return "SqlSnippet";
    case "testing-assets":
      return "TestingAsset";
    default:
      // This should never happen — all ModuleKey values are handled above
      console.warn(`getTableName: unhandled module key`);
      return "";
  }
}

export async function getDashboardData() {
  const [
    tasks, 
    bugs, 
    testCases, 
    meetings, 
    logs,
    taskCount,
    bugCount,
    caseCount,
    meetingCount,
    logCount,
    taskStatus,
    bugSeverity,
    sprint,
    bugFixed,
    taskCompleted,
    activity,
    bugTrend,
    allSprints
  ] = await Promise.all([
    selectAll('SELECT * FROM "Task" ORDER BY "updatedAt" DESC LIMIT 5'),
    selectAll('SELECT * FROM "Bug" ORDER BY "updatedAt" DESC LIMIT 5'),
    selectAll('SELECT * FROM "TestCaseScenario" ORDER BY "updatedAt" DESC LIMIT 5'),
    selectAll('SELECT * FROM "MeetingNote" ORDER BY "date" DESC LIMIT 3'),
    selectAll('SELECT * FROM "DailyLog" ORDER BY "date" DESC LIMIT 3'),
    countRows("Task"),
    countRows("Bug"),
    countRows("TestCaseScenario"),
    countRows("MeetingNote"),
    countRows("DailyLog"),
    selectAll('SELECT status, COUNT(*) as count FROM "Task" GROUP BY status'),
    selectAll('SELECT severity, COUNT(*) as count FROM "Bug" GROUP BY severity'),
    db.get("SELECT * FROM \"Sprint\" WHERE status = 'active' LIMIT 1") as Promise<any>,
    db.get("SELECT COUNT(*) as count FROM \"Bug\" WHERE status IN ('fixed', 'closed')") as Promise<any>,
    db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE status = 'completed'") as Promise<any>,
    getRecentActivity(6),
    selectAll(`SELECT DATE("createdAt") as date, COUNT(*) as count FROM "Bug" WHERE "createdAt" >= DATE('now', '-7 days') GROUP BY DATE("createdAt") ORDER BY date ASC`),
    selectAll('SELECT id, name, startDate, endDate, status FROM "Sprint" ORDER BY startDate DESC LIMIT 20'),
  ]);

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
    personalSuccessRate: successRate
    ,
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
      return (await selectAll('SELECT * FROM "TestPlan" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC')).map(normalizeTestPlanRow);
    case "test-sessions":
      return await selectAll('SELECT * FROM "TestSession" ORDER BY "updatedAt" DESC');
    case "test-cases":
      return (await selectAll('SELECT * FROM "TestCase" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC')).map(normalizeTestCaseRow);
    case "bugs":
      return await selectAll('SELECT * FROM "Bug" ORDER BY "updatedAt" DESC');
    case "tasks":
      return await selectAll('SELECT * FROM "Task" ORDER BY "updatedAt" DESC');
    case "meeting-notes":
      return await selectAll('SELECT * FROM "MeetingNote" ORDER BY "updatedAt" DESC');
    case "daily-logs":
      return await selectAll('SELECT * FROM "DailyLog" ORDER BY "updatedAt" DESC');
    case "api-testing":
      return await selectAll('SELECT * FROM "ApiEndpoint" ORDER BY "updatedAt" DESC');
    case "workload":
      return await selectAll('SELECT * FROM "WorkloadAssignment" ORDER BY "updatedAt" DESC');
    case "env-config":
      return await selectAll('SELECT * FROM "EnvConfig" ORDER BY "updatedAt" DESC');
    case "test-suites":
      return (await selectAll('SELECT * FROM "TestSuite" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC')).map((item) => ({
        ...normalizeTestSuiteRow(item),
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
    case "test-cases":
      return await runInsert(
        `INSERT INTO "TestCase" ("testSuiteId", "tcId", "typeCase", "preCondition", "caseName", "testStep", "expectedResult", "actualResult", status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.testSuiteId, data.tcId, data.typeCase, data.preCondition, data.caseName, data.testStep, data.expectedResult, data.actualResult ?? "", data.status]
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
    case "workload":
      return await runInsert(
        `INSERT INTO "WorkloadAssignment" ("qaName", project, sprint, tasks, status)
         VALUES (?, ?, ?, ?, ?)`,
        [data.qaName, data.project, data.sprint, data.tasks, data.status]
      );
    case "performance":
      return await runInsert(
        `INSERT INTO "PerformanceBenchmark" (date, title, "targetUrl", "loadTime", score, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.date, data.title, data.targetUrl, data.loadTime, data.score, data.notes]
      );
    case "env-config":
      return await runInsert(
        `INSERT INTO "EnvConfig" ("envName", label, url, username, password, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.envName, data.label, data.url, data.username, data.password, data.notes]
      );
    case "test-plans":
      return await runInsert(
        `INSERT INTO "TestPlan" (code, title, project, sprint, scope, status, "startDate", "endDate", assignee, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.code ?? "", data.title, data.project, data.sprint, data.scope, data.status, data.startDate, data.endDate, data.assignee, data.notes]
      );
    case "test-sessions":
      return await runInsert(
        `INSERT INTO "TestSession" (date, project, sprint, tester, scope, "totalCases", passed, failed, blocked, result, notes, evidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.date, data.project, data.sprint, data.tester, data.scope, data.totalCases, data.passed, data.failed, data.blocked, data.result, data.notes, data.evidence]
      );
    case "api-testing":
      return await runInsert(
        `INSERT INTO "ApiEndpoint" (title, method, endpoint, payload, response, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.title, data.method, data.endpoint, data.payload, data.response, data.notes]
      );
    case "test-suites":
      return await runInsert(
        `INSERT INTO "TestSuite" ("testPlanId", title, status, notes)
         VALUES (?, ?, ?, ?)`,
        [data.testPlanId, data.title, data.status, data.notes],
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
    case "workload":
      return await db.run(
        `UPDATE "WorkloadAssignment"
         SET qaName = ?, project = ?, sprint = ?, tasks = ?, status = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.qaName, data.project, data.sprint, data.tasks, data.status, id]
      );
    case "performance":
      return await db.run(
        `UPDATE "PerformanceBenchmark"
         SET date = ?, title = ?, targetUrl = ?, loadTime = ?, score = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.date, data.title, data.targetUrl, data.loadTime, data.score, data.notes, id]
      );
    case "env-config":
      return await db.run(
        `UPDATE "EnvConfig"
         SET envName = ?, label = ?, url = ?, username = ?, password = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.envName, data.label, data.url, data.username, data.password, data.notes, id]
      );
    case "test-plans":
      return await db.run(
        `UPDATE "TestPlan"
         SET code = ?, title = ?, project = ?, sprint = ?, scope = ?, startDate = ?, endDate = ?, assignee = ?, status = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.code ?? "", data.title, data.project, data.sprint, data.scope, data.startDate, data.endDate, data.assignee, data.status, data.notes, id]
      );
    case "test-sessions":
      return await db.run(
        `UPDATE "TestSession"
         SET date = ?, project = ?, sprint = ?, tester = ?, scope = ?, totalCases = ?, passed = ?, failed = ?, blocked = ?, result = ?, notes = ?, evidence = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.date, data.project, data.sprint, data.tester, data.scope, data.totalCases, data.passed, data.failed, data.blocked, data.result, data.notes, data.evidence, id]
      );
    case "api-testing":
      return await db.run(
        `UPDATE "ApiEndpoint"
         SET title = ?, method = ?, endpoint = ?, payload = ?, response = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.title, data.method, data.endpoint, data.payload, data.response, data.notes, id]
      );
    case "bugs":
      return await db.run(
        `UPDATE "Bug"
         SET project = ?, module = ?, "bugType" = ?, title = ?, preconditions = ?, "stepsToReproduce" = ?, "expectedResult" = ?, "actualResult" = ?, severity = ?, priority = ?, status = ?, evidence = ?, "relatedItems" = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.project, data.module, data.bugType, data.title, data.preconditions, data.stepsToReproduce, data.expectedResult, data.actualResult, data.severity, data.priority, data.status, data.evidence, data.relatedItems, id]
      );
    case "tasks":
      return await db.run(
        `UPDATE "Task"
         SET title = ?, project = ?, "relatedFeature" = ?, category = ?, status = ?, priority = ?, "dueDate" = ?, description = ?, notes = ?, evidence = ?, "relatedItems" = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.notes, data.evidence, data.relatedItems, id]
      );
    case "test-suites":
      return await db.run(
        `UPDATE "TestSuite"
         SET "testPlanId" = ?, title = ?, status = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.testPlanId, data.title, data.status, data.notes, id]
      );
     case "sql-snippets":
      return await db.run(
        `UPDATE "SqlSnippet"
         SET "title" = ?, "project" = ?, "query" = ?, "notes" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?`,
        [data.title, data.project, data.query, data.notes, id]
      );
    case "testing-assets":
      return await db.run(
        `UPDATE "TestingAsset"
         SET title = ?, project = ?, url = ?, type = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.title, data.project, data.url, data.type, data.notes, id]
      );
    case "meeting-notes":
      return await db.run(
        `UPDATE "MeetingNote"
         SET date = ?, title = ?, project = ?, participants = ?, summary = ?, decisions = ?, actionItems = ?, notes = ?, evidence = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.date, data.title, data.project, data.participants, data.summary, data.decisions, data.actionItems, data.notes, data.evidence, id]
      );
    case "daily-logs":
      return await db.run(
        `UPDATE "DailyLog"
         SET date = ?, project = ?, whatTested = ?, issuesFound = ?, progressSummary = ?, blockers = ?, nextPlan = ?, notes = ?, evidence = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [data.date, data.project, data.whatTested, data.issuesFound, data.progressSummary, data.blockers, data.nextPlan, data.notes, data.evidence, id]
      );
  }
}

export async function updateModuleStatus(module: ModuleKey, id: string | number, status: string) {
  const tableName = getTableName(module);
  return await db.run(`UPDATE "${tableName}" SET status = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
}

export async function clearModuleRecords(module: ModuleKey) {
  return await db.run(`DELETE FROM "${getTableName(module)}"`);
}

export async function replaceModuleRecords(module: ModuleKey, rows: any[]) {
  for (const row of rows) {
    await createModuleRecord(module, row);
  }
}

export async function getTestCaseScenario(id: string) {
  const item = await db.get('SELECT * FROM "TestCase" WHERE id = ? AND "deletedAt" IS NULL', [id]) as Record<string, unknown> | undefined;
  if (!item) return null;

  return normalizeTestCaseRow(item);
}

export async function getTestCasesByScenario(scenarioId: string) {
  return await db.query('SELECT * FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL ORDER BY id ASC', [scenarioId]);
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
  const tableName = getTableName(module);
  if (module === "test-plans" || module === "test-suites" || module === "test-cases") {
    return await db.run(`UPDATE "${tableName}" SET "deletedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
  }
  return await db.run(`DELETE FROM "${tableName}" WHERE id = ?`, [id]);
}

export async function logActivity(entityType: string, entityId: string | number, action: string, summary: string) {
  await db.run(
    'INSERT INTO "ActivityLog" ("entityType", "entityId", action, summary) VALUES (?, ?, ?, ?)',
    [entityType, String(entityId), action, summary],
  );
}

export async function getRecentActivity(limit = 10) {
  return await db.query(
    'SELECT * FROM "ActivityLog" ORDER BY "createdAt" DESC, id DESC LIMIT ?',
    [limit],
  );
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
