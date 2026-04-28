import { db, isPostgres } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { moduleConfigs, type ModuleKey } from "@/lib/modules";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth";

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
    case "assignees":
      return "Assignee";
    case "meeting-notes":
      return "MeetingNote";
    case "sprints":
      return "Sprint";
    case "users":
      return "User";
    default:
      console.warn(`getTableName: unhandled module key: ${module}`);
      return "";
  }
}

export async function getDashboardData() {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const userRole = user?.role || "user";
  const isAdmin = (userRole === "admin" || userRole === "Admin (Owner)") && !company;
  
  const where = isAdmin ? "" : ' WHERE "company" = ?';
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

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
    selectAll(`SELECT * FROM "Task" ${where} ORDER BY "updatedAt" DESC LIMIT 5`, qParams),
    selectAll(`SELECT * FROM "Bug" ${where} ORDER BY "updatedAt" DESC LIMIT 5`, qParams),
    selectAll(`SELECT * FROM "TestCase" ${where}${isAdmin ? "" : (where ? " AND " : " WHERE ") + '"deletedAt" IS NULL'} ORDER BY "updatedAt" DESC LIMIT 5`, qParams),
    countRows("Task", company),
    countRows("Bug", company),
    countRows("TestCase", company),
    selectAll(`SELECT status, COUNT(*) as count FROM "Task" ${where} GROUP BY status`, qParams),
    selectAll(`SELECT severity, COUNT(*) as count FROM "Bug" ${where} GROUP BY severity`, qParams),
    db.get(`SELECT * FROM "Sprint" WHERE status = 'active' ${andWhere} LIMIT 1`, qParams) as Promise<any>,
    db.get(`SELECT COUNT(*) as count FROM "Bug" WHERE status IN ('fixed', 'closed') ${andWhere}`, qParams) as Promise<any>,
    db.get(`SELECT COUNT(*) as count FROM "Task" WHERE status = 'completed' ${andWhere}`, qParams) as Promise<any>,
    selectAll(`SELECT DATE("createdAt") as date, COUNT(*) as count FROM "Bug" WHERE "createdAt" >= DATE('now', '-7 days') ${andWhere} GROUP BY DATE("createdAt") ORDER BY date ASC`, qParams),
    selectAll(`SELECT id, name, startDate, endDate, status FROM "Sprint" ${where} ORDER BY startDate DESC LIMIT 20`, qParams),
    selectAll(`SELECT * FROM "ActivityLog" ${where} ORDER BY "createdAt" DESC LIMIT 10`, qParams),
    selectAll(`SELECT module, COUNT(*) as count FROM "Bug" ${where} GROUP BY module LIMIT 10`, qParams),
    selectAll(`SELECT 'Task' as type, title as label, status FROM "Task" WHERE DATE("updatedAt") = DATE('now') ${andWhere}`, qParams),
    selectAll(`SELECT 'Bug' as type, title as label, status FROM "Bug" WHERE DATE("updatedAt") = DATE('now') ${andWhere}`, qParams),
    selectAll(`SELECT 'Session' as type, scope as label, result FROM "TestSession" WHERE DATE("createdAt") = DATE('now') ${andWhere}`, qParams),
    selectAll(`SELECT "id", "title", "severity" FROM "Bug" WHERE "severity" IN ('critical', 'high', 'P0', 'P1') AND "status" != 'closed' ${andWhere} ORDER BY "createdAt" DESC LIMIT 3`, qParams),
    selectAll(`SELECT "id", "title", "priority" FROM "Task" WHERE "priority" IN ('High', 'Urgent', 'P0', 'P1') AND "status" != 'done' ${andWhere} ORDER BY "createdAt" DESC LIMIT 3`, qParams),
    countRows("TestSuite", company),
    countRows("TestSession", company),
    selectAll(`SELECT id, date, tester, scope, totalCases, passed, failed, blocked, result FROM "TestSession" ${where} ORDER BY date DESC LIMIT 10`, qParams),
    selectAll(`
      WITH AllAssignees AS (
        SELECT assignee as name FROM "Task" WHERE assignee != '' AND status != 'done' ${andWhere}
        UNION
        SELECT suggestedDev as name FROM "Bug" WHERE suggestedDev != '' AND status != 'closed' ${andWhere}
        UNION
        SELECT assignee as name FROM "TestSuite" WHERE assignee != '' AND status != 'archived' ${andWhere}
        UNION
        SELECT assignee as name FROM "TestPlan" WHERE assignee != '' AND status != 'closed' ${andWhere}
        UNION
        SELECT name FROM "Assignee" WHERE status = 'active' ${andWhere}
      )
      SELECT 
        name,
        (SELECT COUNT(*) FROM "Task" t WHERE t.assignee = AllAssignees.name AND t.status != 'done' ${andWhere}) as taskCount,
        (SELECT COUNT(*) FROM "Bug" b WHERE b.suggestedDev = AllAssignees.name AND b.status != 'closed' ${andWhere}) as bugCount,
        (SELECT COUNT(*) FROM "TestSuite" s WHERE s.assignee = AllAssignees.name AND s.status != 'archived' ${andWhere}) as suiteCount,
        (SELECT COUNT(*) FROM "TestPlan" p WHERE p.assignee = AllAssignees.name AND p.status != 'closed' ${andWhere}) as planCount
      FROM AllAssignees
      WHERE name IS NOT NULL AND name != ''
      ORDER BY name ASC
    `, [...qParams, ...qParams, ...qParams, ...qParams, ...qParams, ...qParams, ...qParams, ...qParams, ...qParams]),
  ]);

  const todayActivity = [...(todayTasks || []), ...(todayBugs || []), ...(todaySessions || [])];

  let sprintInfo = null;
  if (sprint) {
    const [tTotal, tDone] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM "Task" WHERE "sprintId" = ?' + andWhere, [sprint.id, ...qParams]) as Promise<any>,
      db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE \"sprintId\" = ? AND status = 'done'" + andWhere, [sprint.id, ...qParams]) as Promise<any>
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
  
  // Dynamic spotlight project
  const mostActiveProject = await db.get('SELECT project as name FROM "TestPlan" GROUP BY project ORDER BY COUNT(*) DESC LIMIT 1') as any;
  const spotlightName = mostActiveProject?.name || (taskCount > 0 || bugCount > 0 ? "Active Project" : "No active project");

  return {
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
    sprints: allSprints.map((s) => ({
      id: Number(s.id),
      name: String(s.name),
      startDate: String(s.startDate),
      endDate: String(s.endDate),
      status: String(s.status),
    })),
    rolePersona: userRole,
    roleRecommendations: getRoleRecommendations(userRole, { bugs, tasks, todayActivity, critBugs, prioTasks })
  };
}

function getRoleRecommendations(role: string, data: any) {
  const r = role.toLowerCase();
  if (r.includes("qa")) {
    return {
      title: "QA Focus",
      items: [
        { label: "Verify Open Bugs", count: data.bugs.length },
        { label: "Pending Test Sessions", count: data.todayActivity.filter((a: any) => a.type === 'Session').length }
      ]
    };
  }
  if (r.includes("developer") || r.includes("backend") || r.includes("frontend")) {
    return {
      title: "Development Focus",
      items: [
        { label: "Assigned Bugs to Fix", count: data.bugs.filter((b: any) => b.status === 'open' || b.status === 'in_progress').length },
        { label: "Ready for Retest", count: data.bugs.filter((b: any) => b.status === 'ready_to_retest').length }
      ]
    };
  }
  if (r.includes("manager") || r.includes("analyst")) {
    return {
      title: "Project Health",
      items: [
        { label: "Critical Blockers", count: data.critBugs.length },
        { label: "High Priority Tasks", count: data.prioTasks.length }
      ]
    };
  }
  return null;
}

export async function getReportsData() {
  const [bugSeverity, bugStatus, testCaseStatus, bugTrend] = await Promise.all([
    selectAll('SELECT "severity" as name, COUNT(*) as value FROM "Bug" GROUP BY "severity"'),
    selectAll('SELECT "status" as name, COUNT(*) as value FROM "Bug" GROUP BY "status"'),
    selectAll('SELECT "status" as name, COUNT(*) as value FROM "TestCase" GROUP BY "status"'),
    selectAll(`SELECT DATE("createdAt") as date, COUNT(*) as count FROM "Bug" GROUP BY DATE("createdAt") ORDER BY date ASC`),
  ]);

  return {
    bugSeverityData: bugSeverity.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    bugStatusData: bugStatus.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    testCaseStatusData: testCaseStatus.map((row) => ({ name: String(row.name), value: Number(row.value) })),
    bugTrendData: bugTrend.map((row) => ({ date: String(row.date), count: Number(row.count) })),
  };
}


export async function getResourceDetails(name: string) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = (user?.role === "admin" || user?.role === "Admin (Owner)") && !company;
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const companyParam = isAdmin ? [] : [company];

  const [tasks, bugs, suites] = await Promise.all([
    selectAll(`SELECT id, title, status, priority FROM "Task" WHERE assignee = ? ${andWhere} AND status != 'done' ORDER BY createdAt DESC`, [name, ...companyParam]),
    selectAll(`SELECT id, title, status, severity as priority FROM "Bug" WHERE suggestedDev = ? ${andWhere} AND status NOT IN ('closed', 'rejected') ORDER BY createdAt DESC`, [name, ...companyParam]),
    selectAll(`SELECT id, title, status, 'N/A' as priority FROM "TestSuite" WHERE assignee = ? ${andWhere} AND status != 'archived' ORDER BY createdAt DESC`, [name, ...companyParam]),
  ]);

  return {
    tasks: tasks.map(t => ({ ...t, type: 'Task' })),
    bugs: bugs.map(b => ({ ...b, type: 'Bug' })),
    suites: suites.map(s => ({ ...s, type: 'Suite' })),
  };
}

export async function getExecutiveData() {
  const [critRes, totalBugs, openT, tcPass, testCaseTotal] = await Promise.all([
    db.get("SELECT COUNT(*) as count FROM \"Bug\" WHERE \"severity\" IN ('critical', 'high', 'P0', 'P1') AND \"status\" != 'closed'") as Promise<any>,
    countRows("Bug"),
    db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE \"status\" != 'done'") as Promise<any>,
    db.get("SELECT COUNT(*) as count FROM \"TestCase\" WHERE \"status\" IN ('Passed', 'Success')") as Promise<any>,
    countRows("TestCase"),
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
    countRows("Task"),
    db.get("SELECT COUNT(*) as count FROM \"Bug\" WHERE \"status\" IN ('fixed', 'closed')") as Promise<any>,
    db.get("SELECT COUNT(*) as count FROM \"Task\" WHERE \"status\" = 'completed'") as Promise<any>
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
      planName: (await db.get('SELECT "title" FROM "TestPlan" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC LIMIT 1') as any)?.title || "Master Test Strategy",
      projectName: (await db.get('SELECT "project" FROM "TestPlan" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC LIMIT 1') as any)?.project || "All Active Projects"
    }
  };
}

export async function getModuleRows(module: ModuleKey) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  
  const where = isAdmin ? "" : ' WHERE "company" = ?';
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

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
        `SELECT ts.*,
          (SELECT COUNT(*) FROM "TestCase" tc WHERE tc."testSuiteId" = ts.id AND tc."deletedAt" IS NULL AND LOWER(tc."status") = 'passed') AS passed,
          (SELECT COUNT(*) FROM "TestCase" tc WHERE tc."testSuiteId" = ts.id AND tc."deletedAt" IS NULL AND LOWER(tc."status") = 'failed') AS failed,
          (SELECT COUNT(*) FROM "TestCase" tc WHERE tc."testSuiteId" = ts.id AND tc."deletedAt" IS NULL AND LOWER(tc."status") = 'blocked') AS blocked
         FROM "TestSuite" ts WHERE ts."deletedAt" IS NULL${suiteCompanyWhere} ORDER BY ts."updatedAt" DESC`,
        qParams
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
    case "sprints":
      return await selectAll(`SELECT * FROM "Sprint" ${where} ORDER BY "startDate" DESC`, qParams);
    default:
      return [];
  }
}

export async function createModuleRecord(module: ModuleKey, data: any) {
  const user = await getCurrentUser();
  const company = data.company || user?.company || "";

  switch (module) {
    case "test-plans": {
      const res = await runInsert(
        `INSERT INTO "TestPlan" ("company", "publicToken", "title", "project", "sprint", "scope", "status", "startDate", "endDate", "notes", "assignee")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.publicToken || makePublicToken(), data.title, data.project, data.sprint, data.scope, data.status, data.startDate, data.endDate, data.notes ?? "", data.assignee ?? ""]
      );
      await logActivity(company, "TestPlan", String(data.title), "Created", `New test plan: ${data.title}`);
      return res;
    }
    case "test-cases": {
      const res = await runInsert(
        `INSERT INTO "TestCase" ("company", "publicToken", "testSuiteId", "tcId", "typeCase", "preCondition", "caseName", "testStep", "expectedResult", "actualResult", "status", "evidence", "priority")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.publicToken || makePublicToken(), data.testSuiteId, data.tcId, data.typeCase, data.preCondition, data.caseName, data.testStep, data.expectedResult, data.actualResult ?? "", data.status, data.evidence ?? "", data.priority ?? "Medium"]
      );
      await logActivity(company, "TestCase", String(data.tcId), "Created", `Added test case: ${data.tcId} - ${data.caseName}`);
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
      return res;
    }
    case "tasks": {
      const res = await runInsert(
        `INSERT INTO "Task" ("company", "title", "project", "relatedFeature", "category", "status", "priority", "dueDate", "description", "notes", "evidence", "relatedItems", "assignee")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.notes, data.evidence, data.relatedItems, data.assignee ?? ""],
      );
      await logActivity(company, "Task", String(data.title), "Created", `New task assigned: ${data.title}`);
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
      return res;
    }
    case "assignees": {
      const res = await runInsert(
        `INSERT INTO "Assignee" ("company", "name", "role", "email", "skills", "status")
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company, data.name, data.role ?? "", data.email ?? "", data.skills ?? "", data.status]
      );
      await logActivity(company, "Assignee", String(data.name), "Added", `New team member: ${data.name}`);
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
      return res;
    }
    case "sprints": {
      const res = await runInsert(
        `INSERT INTO "Sprint" ("company", "name", "startDate", "endDate", "status", "goal")
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company, data.name, data.startDate, data.endDate, data.status, data.goal ?? ""]
      );
      await logActivity(company, "Sprint", String(data.name), "Created", `Sprint ${data.name} started`);
      return res;
    }
    case "meeting-notes": {
      const res = await runInsert(
        `INSERT INTO "MeetingNote" ("company", "publicToken", "date", "project", "title", "attendees", "content", "actionItems")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, data.publicToken || makePublicToken(), data.date || new Date().toISOString(), data.project, data.title, data.attendees ?? "", data.content ?? "", data.actionItems ?? ""]
      );
      await logActivity(company, "MeetingNote", String(data.title), "Created", `Notes recorded for: ${data.title}`);
      return res;
    }
    default:
      return null;
  }
}

export async function updateModuleRecord(module: ModuleKey, id: string | number, data: any) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const companyFilter = isAdmin ? "" : ' AND "company" = ?';
  const companyParam = isAdmin ? [] : [company];

  switch (module) {
    case "tasks": {
      const res = await db.run(
        `UPDATE "Task"
         SET "title" = ?, "project" = ?, "relatedFeature" = ?, "category" = ?, "status" = ?, "priority" = ?, "dueDate" = ?, "description" = ?, "notes" = ?, "evidence" = ?, "relatedItems" = ?, "assignee" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = ?${companyFilter}`,
        [data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.notes, data.evidence, data.relatedItems, data.assignee ?? "", id, ...companyParam]
      );
      await logActivity(company, "Task", String(data.title), "Updated", `Task ${data.title} updated to ${data.status}`);
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
        return res;
      } else {
        const res = await db.run(
          `UPDATE "User" SET "name" = ?, "username" = ?, "role" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?${companyFilter}`,
          [data.name, data.username, data.role, id, ...companyParam]
        );
        await logActivity(company, "User", String(data.username), "Updated", `User info for ${data.username} updated`);
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
      return res;
    }
    default:
      return null;
  }
}

export async function deleteModuleRecord(module: ModuleKey, id: string | number) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const companyFilter = isAdmin ? "" : ' AND "company" = ?';
  const companyParam = isAdmin ? [] : [company];

  const table = getTableName(module);
  if (!table) return null;
  
  const entityId = String(id);
  
  if (["TestCase", "TestPlan", "TestSuite", "MeetingNote"].includes(table)) {
    const res = await db.run(`UPDATE "${table}" SET "deletedAt" = CURRENT_TIMESTAMP WHERE id = ?${companyFilter}`, [id, ...companyParam]);
    await logActivity(company, table, entityId, "Deleted", `${table} removed`);
    return res;
  }
  
  const res = await db.run(`DELETE FROM "${table}" WHERE id = ?${companyFilter}`, [id, ...companyParam]);
  await logActivity(company, table, entityId, "Deleted", `${table} permanently deleted`);
  return res;
}

export async function getTestPlanByToken(token: string) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const item = await db.get(
    'SELECT * FROM "TestPlan" WHERE "publicToken" = ? AND "deletedAt" IS NULL AND ("company" = ? OR ? = \'\')',
    [token, company, company],
  ) as Record<string, unknown> | undefined;
  if (!item) return null;
  return normalizeTestPlanRow(item);
}

export async function getTestSuitesByPlanId(planId: string) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const rows = await selectAll('SELECT * FROM "TestSuite" WHERE "testPlanId" = ? AND "deletedAt" IS NULL AND ("company" = ? OR ? = \'\') ORDER BY "updatedAt" DESC', [planId, company, company]);
  return rows.map(item => normalizeTestSuiteRow(item));
}

export async function getReleaseNotes() {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const where = isAdmin ? "" : ' AND "company" = ?';
  const params = isAdmin ? [] : [company];

  const bugs = await selectAll(`SELECT * FROM "Bug" WHERE "status" IN ('fixed', 'closed') ${where} ORDER BY "updatedAt" DESC LIMIT 20`, params);
  const tasks = await selectAll(`SELECT * FROM "Task" WHERE "status" = 'completed' ${where} ORDER BY "updatedAt" DESC LIMIT 20`, params);
  
  return {
    fixedBugs: bugs.map(b => ({ code: codeFromId("BUG", Number(b.id)), title: b.title, severity: b.severity })),
    completedTasks: tasks.map(t => ({ code: codeFromId("TASK", Number(t.id)), title: t.title }))
  };
}

function toSqliteDatetime(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export async function getQualityTrend() {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (i * 7));
    const start = new Date(d);
    start.setDate(start.getDate() - 7);
    weeks.push({
      label: `Week -${i}`,
      start: toSqliteDatetime(start),
      end: toSqliteDatetime(d),
    });
  }

  const trend = await Promise.all(weeks.reverse().map(async (w) => {
    const [bugsRes, fixedRes] = await Promise.all([
      db.get(`SELECT COUNT(*) as count FROM "Bug" WHERE "createdAt" BETWEEN ? AND ? ${andWhere}`, [w.start, w.end, ...qParams]) as Promise<any>,
      db.get(`SELECT COUNT(*) as count FROM "Bug" WHERE "status" = 'fixed' AND "updatedAt" BETWEEN ? AND ? ${andWhere}`, [w.start, w.end, ...qParams]) as Promise<any>,
    ]);
    return {
      label: w.label,
      bugs: Number(bugsRes.count),
      fixed: Number(fixedRes.count),
    };
  }));
  return trend;
}

export async function getTestSuite(id: string | number) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

  const item = await db.get(`SELECT * FROM "TestSuite" WHERE id = ? AND "deletedAt" IS NULL ${andWhere}`, [id, ...qParams]) as Record<string, unknown> | undefined;
  if (!item) return null;
  return { ...item, code: codeFromId("SUITE", Number(id)) };
}

export async function getTestCasesByIdStrings(idStrings: string) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

  if (!idStrings.trim()) return [];
  const rows = await selectAll(
    `SELECT * FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL ${andWhere} ORDER BY "id" ASC`,
    [idStrings.trim(), ...qParams],
  );
  return rows.map((r) => ({ ...normalizeTestCaseRow(r), code: codeFromId("TC", Number(r.id)) }));
}


export async function getProjectData(projectName: string) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

  const [plans, bugs, tasks, sessions, meetings] = await Promise.all([
    selectAll(`SELECT * FROM "TestPlan" WHERE project = ? AND "deletedAt" IS NULL ${andWhere}`, [projectName, ...qParams]),
    selectAll(`SELECT * FROM "Bug" WHERE project = ? ${andWhere}`, [projectName, ...qParams]),
    selectAll(`SELECT * FROM "Task" WHERE project = ? ${andWhere}`, [projectName, ...qParams]),
    selectAll(`SELECT * FROM "TestSession" WHERE project = ? ${andWhere}`, [projectName, ...qParams]),
    selectAll(`SELECT * FROM "MeetingNote" WHERE project = ? AND "deletedAt" IS NULL ${andWhere} ORDER BY "date" DESC`, [projectName, ...qParams]),
  ]);

  // For stats, we need suites and cases too
  const planIds = plans.map(p => String(p.id));
  let suites: any[] = [];
  if (planIds.length > 0) {
    const placeholders = planIds.map(() => '?').join(',');
    suites = await selectAll(`SELECT * FROM "TestSuite" WHERE testPlanId IN (${placeholders}) AND "deletedAt" IS NULL ${andWhere}`, [...planIds, ...qParams]);
  }

  const suiteIds = suites.map(s => String(s.id));
  let cases: any[] = [];
  if (suiteIds.length > 0) {
    const placeholders = suiteIds.map(() => '?').join(',');
    cases = await selectAll(`SELECT * FROM "TestCase" WHERE testSuiteId IN (${placeholders}) AND "deletedAt" IS NULL ${andWhere}`, [...suiteIds, ...qParams]);
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

async function countRows(table: string, company?: string) {
  const where = company ? ' WHERE "company" = ?' : '';
  const params = company ? [company] : [];
  const result = await db.get(`SELECT COUNT(*) as total FROM "${table}"${where}`, params) as { total: number };
  return Number(result?.total || 0);
}

async function selectAll(sqlStr: string, params: any[] = []) {
  return await db.query(sqlStr, params) as Array<Record<string, string | number | null>>;
}

async function runInsert(sqlStr: string, params: any[]) {
  return await db.run(sqlStr, params);
}

export async function getTestSuiteByToken(token: string) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = (user?.role === "admin" || user?.role === "Admin (Owner)") && !company;
  const andCompany = (!user || isAdmin) ? "" : ' AND "company" = ?';
  const params: unknown[] = token ? [token] : [];
  if (andCompany) params.push(company);
  return await db.get(`SELECT * FROM "TestSuite" WHERE "publicToken" = ? AND "deletedAt" IS NULL${andCompany}`, params) as Record<string, unknown> | undefined;
}

export async function getTestCasesByScenario(suiteId: string | number) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

  return await selectAll(`SELECT * FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL ${andWhere} ORDER BY id ASC`, [suiteId, ...qParams]);
}

export async function getAllTestCasesWithSuite() {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = (user?.role === "admin" || user?.role === "Admin (Owner)") && !company;
  const andWhere = isAdmin ? "" : ' AND tc."company" = ?';
  const qParams = isAdmin ? [] : [company];

  return await selectAll(
    `SELECT tc.*, ts.title AS suiteTitle, ts.publicToken AS suiteToken, ts.status AS suiteStatus,
            tp.title AS planTitle, tp.project AS planProject
     FROM "TestCase" tc
     LEFT JOIN "TestSuite" ts ON ts.id = tc."testSuiteId" AND ts."deletedAt" IS NULL
     LEFT JOIN "TestPlan" tp ON tp.id = ts."testPlanId" AND tp."deletedAt" IS NULL
     WHERE tc."deletedAt" IS NULL${andWhere}
     ORDER BY tc."testSuiteId" ASC, tc.id ASC`,
    qParams
  );
}

async function logActivity(company: string, type: string, id: string, action: string, summary: string) {
  try {
    await db.run(
      `INSERT INTO "ActivityLog" ("company", "entityType", "entityId", "action", "summary")
       VALUES (?, ?, ?, ?, ?)`,
      [company, type, id, action, summary]
    );
  } catch (e) {
    console.error("Activity logging failed:", e);
  }
}

export async function updateModuleStatus(module: ModuleKey, id: string | number, status: string) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

  const table = getTableName(module);
  if (!table) return null;
  const res = await db.run(`UPDATE "${table}" SET "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?${andWhere}`, [status, id, ...qParams]);
  await logActivity(company, table, String(id), "Status Update", `${table} status updated to ${status}`);
  return res;
}

export async function clearModuleRecords(module: ModuleKey) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const where = isAdmin ? "" : ' WHERE "company" = ?';
  const params = isAdmin ? [] : [company];

  const table = getTableName(module);
  if (!table) return null;
  return await db.run(`DELETE FROM "${table}"${where}`, params);
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
