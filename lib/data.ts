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
import {
  invalidateDashboardCache,
  getBugSeverityCounts,
  getTestPassRate,
  computeQualityHealthScore,
  clamp,
  getDashboardProjects,
  getProjectOptions,
  getBacklogOptions,
  getAssigneeOptions,
  getTestPlanReferenceRows,
  getTestSuitesByPlanIds,
  getTestCaseStatsBySuiteIds,
  getDashboardData,
  getReportsData,
  getResourceDetails,
  getExecutiveData,
  getComments,
  createComment,
  upsertHeartbeat,
  getOnlineMembers,
  removeStalePresence,
  getFilters,
  createFilter,
  deleteFilter,
  checkFilterNameUnique,
} from "@/lib/data-dashboard";
import { getModuleRows, getModuleRowsPage } from "@/lib/data-module-read";

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

export {
  invalidateDashboardCache,
  getBugSeverityCounts,
  getTestPassRate,
  computeQualityHealthScore,
  clamp,
  getDashboardProjects,
  getProjectOptions,
  getBacklogOptions,
  getAssigneeOptions,
  getTestPlanReferenceRows,
  getTestSuitesByPlanIds,
  getTestCaseStatsBySuiteIds,
  getDashboardData,
  getReportsData,
  getResourceDetails,
  getExecutiveData,
  getModuleRows,
  getModuleRowsPage,
  getComments,
  createComment,
  upsertHeartbeat,
  getOnlineMembers,
  removeStalePresence,
  getFilters,
  createFilter,
  deleteFilter,
  checkFilterNameUnique,
};

export async function createModuleRecord(module: ModuleKey, data: any) {
  const user = await getCurrentUser();
  const company = getWriteCompany(user, data.company);
  const actor = user?.name || user?.email || "";


  switch (module) {
    case "test-plans": {
      const publicToken = data.publicToken || makePublicToken();
      const res = await runInsert(
        `INSERT INTO "TestPlan" ("company", "publicToken", "title", "project", "sprint", "scope", "status", "startDate", "endDate", "notes", "assignee")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [company, publicToken, data.title, data.project, data.sprint, data.scope, data.status, data.startDate, data.endDate, data.notes ?? "", data.assignee ?? ""]
      );
      await logActivity(company, "TestPlan", String(data.title), "Created", `New test plan: ${data.title}`, actor);
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
      await logActivity(company, "TestCase", String(data.tcId), "Created", `Added test case: ${data.tcId} - ${data.caseName}`, actor);
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
      await logActivity(company, "Bug", String(data.title), "Created", `New bug recorded: ${data.title}`, actor);
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
      await logActivity(company, "Task", String(data.title), "Created", `New task assigned: ${data.title}`, actor);
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
      await logActivity(company, "Session", data.date, "Executed", `Test execution session by ${data.tester} (${data.result})`, actor);
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
      await logActivity(company, "TestSuite", String(data.title), "Created", `Suite created: ${data.title}`, actor);
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
      await logActivity(company, "Assignee", String(data.name), "Added", `New team member: ${data.name}`, actor);
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
      await logActivity(company, "User", String(data.email), "Created", `Access granted for ${data.email}`, actor);
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
      await logActivity(company, "Sprint", String(data.name), "Created", `Sprint ${data.name} started`, actor);
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
      await logActivity(company, "MeetingNote", String(data.title), "Created", `Notes recorded for: ${data.title}`, actor);
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
      await logActivity(company, "Deployment", String(data.version), "Deployed", `Deployment ${data.version} to ${data.environment}: ${data.status}`, actor);
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
  const currentUser = await getCurrentUser();
  const scope = getAccessScope(currentUser);
  const { company, where: _where, andWhere: companyFilter, params: companyParam } = scope;
  const actor = currentUser?.name || currentUser?.email || "";


  switch (module) {
    case "tasks": {
      const res = await db.run(
        `UPDATE "Task"
         SET "title" = ?, "project" = ?, "relatedFeature" = ?, "category" = ?, "status" = ?, "priority" = ?, "dueDate" = ?, "description" = ?, "acceptanceCriteria" = ?, "notes" = ?, "evidence" = ?, "relatedItems" = ?, "assignee" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.title, data.project, data.relatedFeature, data.category, data.status, data.priority, data.dueDate, data.description, data.acceptanceCriteria, data.notes, data.evidence, data.relatedItems, data.assignee ?? "", id, ...companyParam]
      );
      await logActivity(company, "Task", String(data.title), "Updated", `Task ${data.title} updated to ${data.status}`, actor);
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
         SET "project" = ?, "module" = ?, "bugType" = ?, "title" = ?, "preconditions" = ?, "stepsToReproduce" = ?, "expectedResult" = ?, "actualResult" = ?, "severity" = ?, "priority" = ?, "status" = ?, "suggestedDev" = ?, "relatedItems" = ?, "evidence" = ?, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = CAST(? AS INTEGER)${companyFilter}`,
        [data.project, data.module, data.bugType, data.title, data.preconditions, data.stepsToReproduce, data.expectedResult, data.actualResult, data.severity, data.priority, data.status, data.suggestedDev ?? "", data.relatedItems ?? "", data.evidence, id, ...companyParam]
      );
      await logActivity(company, "Bug", String(data.title), "Updated", `Bug ${data.title} marked as ${data.status}`, actor);
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
      await logActivity(company, "TestPlan", String(data.title), "Updated", `Plan ${data.title} revised`, actor);
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
      await logActivity(company, "Session", String(data.date), "Updated", `Test session results updated`, actor);
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
      await logActivity(company, "TestCase", String(data.caseName), "Updated", `Test case ${data.caseName} updated`, actor);
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
      await logActivity(company, "TestSuite", String(data.title), "Updated", `Suite ${data.title} updated`, actor);
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
      await logActivity(company, "Assignee", String(data.name), "Updated", `Profile for ${data.name} updated`, actor);
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
        await logActivity(company, "User", String(data.email), "Updated", `Security settings for ${data.email} updated`, actor);
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
        await logActivity(company, "User", String(data.email), "Updated", `User info for ${data.email} updated`, actor);
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
      await logActivity(company, "Sprint", String(data.name), "Updated", `Sprint ${data.name} updated to ${data.status}`, actor);
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
      await logActivity(company, "MeetingNote", String(data.title), "Updated", `Meeting notes for ${data.title} revised`, actor);
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
      await logActivity(company, "Deployment", String(data.version), "Updated", `Deployment ${data.version} updated to ${data.status}`, actor);
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
  const currentUser = await getCurrentUser();
  const scope = getAccessScope(currentUser);
  const { company, andWhere: companyFilter, params: companyParam } = scope;
  const actor = currentUser?.name || currentUser?.email || "";

  const table = getTableName(module);
  if (!table) return null;

  const entityId = String(id);

  if (table === "User") {
    await deleteAssigneeForUser(Number(id));
  }

  const res = await db.run(`UPDATE "${table}" SET "deletedAt" = CURRENT_TIMESTAMP WHERE id = CAST(? AS INTEGER)${companyFilter}`, [id, ...companyParam]);
  await logActivity(company, table, entityId, "Deleted", `${table} removed`, actor);
  await clearSearchIndex(module, company, entityId);
  if (table === "User") {
    await clearSearchIndex("assignees", company, entityId);
  }
  invalidateDashboardCache(company);
  return res;
}

export async function deleteModuleRecords(module: ModuleKey, ids: (string | number)[]) {
  if (ids.length === 0) return;
  const currentUser = await getCurrentUser();
  const scope = getAccessScope(currentUser);
  const { company, andWhere: companyFilter, params: companyParam } = scope;
  const actor = currentUser?.name || currentUser?.email || "";

  const table = getTableName(module);
  if (!table) return;

  const placeholderList = ids.map(() => "?").join(", ");

  await db.run(
    `UPDATE "${table}" SET "deletedAt" = CURRENT_TIMESTAMP WHERE id IN (${placeholderList})${companyFilter}`,
    [...ids, ...companyParam]
  );

  await logActivity(company, table, ids.join(","), "Deleted", `${ids.length} ${table} records deleted`, actor);
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
  const currentUser = await getCurrentUser();
  const { company, andWhere, params: qParams } = getAccessScope(currentUser);
  const actor = currentUser?.name || currentUser?.email || "";

  const table = getTableName(module);
  if (!table) return null;
  const hasSortOrder = typeof sortOrder === "number" && Number.isFinite(sortOrder);
  const res = await db.run(
    `UPDATE "${table}" SET "status" = ?, ${hasSortOrder ? '"sortOrder" = ?, ' : ''}"updatedAt" = CURRENT_TIMESTAMP WHERE "id" = CAST(? AS INTEGER)${andWhere}`,
    hasSortOrder ? [status, sortOrder, id, ...qParams] : [status, id, ...qParams]
  );
  await logActivity(company, table, String(id), "Status Update", `${table} status updated to ${status}`, actor);
  const updatedRow = await db.get<Record<string, unknown>>(`SELECT * FROM "${table}" WHERE id = CAST(? AS INTEGER)${andWhere}`, [id, ...qParams]);
  if (updatedRow) {
    await syncSearchIndex(module, company, String(id), updatedRow);
  }
  invalidateDashboardCache(company);
  return res;
}

export async function clearModuleRecords(module: ModuleKey) {
  const currentUser = await getCurrentUser();
  const { company, where, params } = getAccessScope(currentUser);
  const actor = currentUser?.name || currentUser?.email || "";

  const table = getTableName(module);
  if (!table) return null;
  const rows = shouldIndexModule(module) ? await selectAll(`SELECT "id" FROM "${table}"${where}`, params) : [];
  const res = await db.run(`DELETE FROM "${table}"${where}`, params);
  await logActivity(company, table, "ALL", "Cleared", `${table} records cleared`, actor);
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
