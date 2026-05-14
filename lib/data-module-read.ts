import { db, isPostgres } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { type ModuleKey } from "@/lib/modules";
import { buildSearchClause, countRows, getAccessScope, normalizeTestCaseRow, normalizeTestPlanRow, normalizeTestSuiteRow } from "@/lib/data-helpers";
import { generateDeploymentNotes } from "@/lib/deployment-notes";
import { normalizeRole } from "@/lib/roles";

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

