import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { normalizeTestPlanRow, normalizeTestSuiteRow, normalizeTestCaseRow } from "@/lib/data-helpers";

async function selectAll(sqlStr: string, params: unknown[] = []): Promise<Array<Record<string, string | number | null>>> {
  return db.query<Record<string, string | number | null>>(sqlStr, params);
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
  const rows = await selectAll(
    'SELECT * FROM "TestSuite" WHERE "testPlanId" = ? AND "deletedAt" IS NULL AND ("company" = ? OR ? = \'\') ORDER BY "updatedAt" DESC',
    [planId, company, company],
  );
  return rows.map((item) => normalizeTestSuiteRow(item));
}

export async function getReleaseNotes() {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const where = isAdmin ? "" : ' AND "company" = ?';
  const params = isAdmin ? [] : [company];

  const bugs = await selectAll(
    `SELECT * FROM "Bug" WHERE "status" IN ('fixed', 'closed') ${where} ORDER BY "updatedAt" DESC LIMIT 20`,
    params,
  );
  const tasks = await selectAll(
    `SELECT * FROM "Task" WHERE "status" = 'completed' ${where} ORDER BY "updatedAt" DESC LIMIT 20`,
    params,
  );

  return {
    fixedBugs: bugs.map((b) => ({ code: codeFromId("BUG", Number(b.id)), title: b.title, severity: b.severity })),
    completedTasks: tasks.map((t) => ({ code: codeFromId("TASK", Number(t.id)), title: t.title })),
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
    d.setDate(d.getDate() - i * 7);
    const start = new Date(d);
    start.setDate(start.getDate() - 7);
    weeks.push({ label: `Week -${i}`, start: toSqliteDatetime(start), end: toSqliteDatetime(d) });
  }

  return Promise.all(
    weeks.reverse().map(async (w) => {
      const [bugsRes, fixedRes] = await Promise.all([
        db.get(`SELECT COUNT(*) as count FROM "Bug" WHERE "createdAt" BETWEEN ? AND ? ${andWhere}`, [w.start, w.end, ...qParams]) as Promise<any>,
        db.get(`SELECT COUNT(*) as count FROM "Bug" WHERE "status" = 'fixed' AND "updatedAt" BETWEEN ? AND ? ${andWhere}`, [w.start, w.end, ...qParams]) as Promise<any>,
      ]);
      return { label: w.label, bugs: Number(bugsRes.count), fixed: Number(fixedRes.count) };
    }),
  );
}

export async function getTestSuite(id: string | number) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

  const item = await db.get(
    `SELECT * FROM "TestSuite" WHERE id = ? AND "deletedAt" IS NULL ${andWhere}`,
    [id, ...qParams],
  ) as Record<string, unknown> | undefined;
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

  const planIds = plans.map((p) => String(p.id));
  let suites: any[] = [];
  if (planIds.length > 0) {
    const placeholders = planIds.map(() => "?").join(",");
    suites = await selectAll(
      `SELECT * FROM "TestSuite" WHERE testPlanId IN (${placeholders}) AND "deletedAt" IS NULL ${andWhere}`,
      [...planIds, ...qParams],
    );
  }

  const suiteIds = suites.map((s) => String(s.id));
  let cases: any[] = [];
  if (suiteIds.length > 0) {
    const placeholders = suiteIds.map(() => "?").join(",");
    cases = await selectAll(
      `SELECT * FROM "TestCase" WHERE testSuiteId IN (${placeholders}) AND "deletedAt" IS NULL ${andWhere}`,
      [...suiteIds, ...qParams],
    );
  }

  const totalCases = cases.length;
  const passed = cases.filter((c) => String(c.status).toLowerCase() === "passed").length;
  const failed = cases.filter((c) => String(c.status).toLowerCase() === "failed").length;

  return {
    projectName,
    plans: plans.map(normalizeTestPlanRow),
    bugs: bugs.map((b) => ({ ...b, code: codeFromId("BUG", Number(b.id)) })),
    tasks: tasks.map((t) => ({ ...t, code: codeFromId("TASK", Number(t.id)) })),
    sessions: sessions.map((s) => ({ ...s, code: codeFromId("SES", Number(s.id)) })),
    meetings: meetings.map((m) => ({ ...m, code: codeFromId("MEET", Number(m.id)) })),
    stats: {
      totalPlans: plans.length,
      totalBugs: bugs.length,
      totalTasks: tasks.length,
      totalCases,
      passed,
      failed,
      successRate: totalCases > 0 ? Math.round((passed / totalCases) * 100) : 0,
    },
  };
}

export async function getTestSuiteByToken(token: string) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = (user?.role === "admin" || user?.role === "Admin (Owner)") && !company;
  const andCompany = !user || isAdmin ? "" : ' AND "company" = ?';
  const params: unknown[] = [token];
  if (andCompany) params.push(company);
  return db.get(
    `SELECT * FROM "TestSuite" WHERE "publicToken" = ? AND "deletedAt" IS NULL${andCompany}`,
    params,
  ) as Promise<Record<string, unknown> | undefined>;
}

export async function getTestCasesByScenario(suiteId: string | number) {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = user?.role === "admin" && !company;
  const andWhere = isAdmin ? "" : ' AND "company" = ?';
  const qParams = isAdmin ? [] : [company];

  return selectAll(
    `SELECT * FROM "TestCase" WHERE "testSuiteId" = ? AND "deletedAt" IS NULL ${andWhere} ORDER BY id ASC`,
    [suiteId, ...qParams],
  );
}

export async function getAllTestCasesWithSuite() {
  const user = await getCurrentUser();
  const company = user?.company || "";
  const isAdmin = (user?.role === "admin" || user?.role === "Admin (Owner)") && !company;
  const andWhere = isAdmin ? "" : ' AND tc."company" = ?';
  const qParams = isAdmin ? [] : [company];

  return selectAll(
    `SELECT tc.*, ts.title AS suiteTitle, ts.publicToken AS suiteToken, ts.status AS suiteStatus,
            tp.title AS planTitle, tp.project AS planProject
     FROM "TestCase" tc
     LEFT JOIN "TestSuite" ts ON ts.id = tc."testSuiteId" AND ts."deletedAt" IS NULL
     LEFT JOIN "TestPlan" tp ON tp.id = ts."testPlanId" AND tp."deletedAt" IS NULL
     WHERE tc."deletedAt" IS NULL${andWhere}
     ORDER BY tc."testSuiteId" ASC, tc.id ASC`,
    qParams,
  );
}
