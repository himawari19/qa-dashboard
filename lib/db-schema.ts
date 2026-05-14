export const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const isPostgres = !!databaseUrl.startsWith("postgres");
export const useSqlite = !isPostgres;

// Core QA Tables Definition
export const tables = [
  {
    name: "Sprint",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "name" TEXT NOT NULL,
      "startDate" TEXT,
      "endDate" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "goal" TEXT DEFAULT '',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "Task",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "sprintId" FK_INT_SPRINT,
      "title" TEXT NOT NULL,
      "project" TEXT NOT NULL,
      "relatedFeature" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "priority" TEXT NOT NULL,
      "dueDate" TEXT,
      "description" TEXT NOT NULL,
      "acceptanceCriteria" TEXT NOT NULL DEFAULT '',
      "notes" TEXT NOT NULL DEFAULT '',
      "evidence" TEXT NOT NULL DEFAULT '',
      "relatedItems" TEXT DEFAULT '',
      "assignee" TEXT DEFAULT '',
      "attachments" TEXT DEFAULT '',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "Bug",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "sprintId" FK_INT_SPRINT,
      "project" TEXT NOT NULL,
      "module" TEXT NOT NULL,
      "bugType" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "preconditions" TEXT NOT NULL,
      "stepsToReproduce" TEXT NOT NULL,
      "expectedResult" TEXT NOT NULL,
      "actualResult" TEXT DEFAULT '',
      "severity" TEXT NOT NULL,
      "priority" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "evidence" TEXT NOT NULL DEFAULT '',
      "relatedItems" TEXT DEFAULT '',
      "suggestedDev" TEXT DEFAULT '',
      "attachments" TEXT DEFAULT '',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestCase",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "publicToken" TEXT NOT NULL DEFAULT '',
      "testSuiteId" TEXT NOT NULL DEFAULT '',
      "tcId" TEXT NOT NULL,
      "typeCase" TEXT NOT NULL,
      "preCondition" TEXT NOT NULL,
      "caseName" TEXT NOT NULL,
      "assignee" TEXT DEFAULT '',
      "testStep" TEXT NOT NULL,
      "expectedResult" TEXT NOT NULL,
      "actualResult" TEXT DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'Pending',
      "automationResult" TEXT,
      "evidence" TEXT DEFAULT '',
      "priority" TEXT DEFAULT 'Medium',
      "lastRunAt" TEXT,
      "relatedItems" TEXT DEFAULT '',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestPlan",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "publicToken" TEXT NOT NULL DEFAULT '',
      "title" TEXT NOT NULL,
      "project" TEXT NOT NULL,
      "sprint" TEXT NOT NULL,
      "scope" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "startDate" TEXT,
      "endDate" TEXT,
      "assignee" TEXT,
      "notes" TEXT,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestSession",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "date" TEXT NOT NULL,
      "project" TEXT NOT NULL,
      "sprint" TEXT NOT NULL,
      "tester" TEXT NOT NULL,
      "scope" TEXT NOT NULL,
      "totalCases" TEXT,
      "passed" TEXT,
      "failed" TEXT,
      "blocked" TEXT,
      "result" TEXT NOT NULL,
      "notes" TEXT,
      "evidence" TEXT,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestSuite",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "publicToken" TEXT NOT NULL DEFAULT '',
      "testPlanId" TEXT NOT NULL DEFAULT '',
      "title" TEXT NOT NULL,
      "assignee" TEXT,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "notes" TEXT,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "ActivityLog",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "summary" TEXT NOT NULL,
      "actor" TEXT NOT NULL DEFAULT '',
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "SearchToken",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "entityIdInt" INTEGER NOT NULL DEFAULT 0,
      "token" TEXT NOT NULL,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "MeetingNote",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "publicToken" TEXT NOT NULL DEFAULT '',
      "date" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "project" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "attendees" TEXT NOT NULL DEFAULT '',
      "content" TEXT NOT NULL DEFAULT '',
      "summary" TEXT NOT NULL DEFAULT '',
      "actionItems" TEXT NOT NULL DEFAULT '',
      "relatedItems" TEXT DEFAULT '',
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "Assignee",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "userId" INTEGER UNIQUE,
      "name" TEXT NOT NULL,
      "role" TEXT,
      "email" TEXT,
      "skills" TEXT DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'active',
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "User",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "name" TEXT,
      "email" TEXT UNIQUE,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'qa',
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "Invite",
    schema: `
      "id" SERIAL_OR_PK,
      "token" TEXT NOT NULL UNIQUE,
      "company" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'qa',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "createdBy" TEXT NOT NULL DEFAULT '',
      "expiresAt" DATE_TYPE NOT NULL,
      "acceptedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "Deployment",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "date" TEXT NOT NULL,
      "version" TEXT NOT NULL,
      "project" TEXT NOT NULL,
      "environment" TEXT NOT NULL DEFAULT 'staging',
      "developer" TEXT NOT NULL,
      "changelog" TEXT NOT NULL DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'success',
      "notes" TEXT DEFAULT '',
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "ExecutionRun",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "testSuiteId" INTEGER NOT NULL,
      "testPlanId" TEXT NOT NULL DEFAULT '',
      "runNumber" INTEGER NOT NULL DEFAULT 1,
      "status" TEXT NOT NULL DEFAULT 'in-progress',
      "tester" TEXT NOT NULL DEFAULT '',
      "totalCases" INTEGER NOT NULL DEFAULT 0,
      "passed" INTEGER NOT NULL DEFAULT 0,
      "failed" INTEGER NOT NULL DEFAULT 0,
      "blocked" INTEGER NOT NULL DEFAULT 0,
      "notes" TEXT DEFAULT '',
      "startedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "completedAt" DATE_TYPE,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "CaseVerdict",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "executionRunId" INTEGER NOT NULL,
      "testCaseId" INTEGER NOT NULL,
      "verdict" TEXT NOT NULL DEFAULT 'Pending',
      "actualResult" TEXT DEFAULT '',
      "evidence" TEXT DEFAULT '',
      "duration" INTEGER NOT NULL DEFAULT 0,
      "executedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "DashboardComment",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "entityType" TEXT NOT NULL,
      "entityId" INTEGER NOT NULL,
      "authorId" INTEGER NOT NULL,
      "authorName" TEXT NOT NULL DEFAULT '',
      "content" TEXT NOT NULL,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "PresenceHeartbeat",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "userId" INTEGER NOT NULL,
      "userName" TEXT NOT NULL DEFAULT '',
      "lastSeen" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "DashboardFilter",
    schema: `
      "id" SERIAL_OR_PK,
      "company" TEXT NOT NULL DEFAULT '',
      "userId" INTEGER NOT NULL,
      "userName" TEXT NOT NULL DEFAULT '',
      "name" TEXT NOT NULL,
      "project" TEXT NOT NULL DEFAULT '',
      "activityScope" TEXT NOT NULL DEFAULT 'team',
      "density" TEXT NOT NULL DEFAULT 'comfortable',
      "shared" INTEGER NOT NULL DEFAULT 0,
      "deletedAt" DATE_TYPE,
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  }
];

const indexSql = `
CREATE INDEX IF NOT EXISTS "idx_task_company" ON "Task"("company");
CREATE INDEX IF NOT EXISTS "idx_task_company_updated" ON "Task"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_task_company_status" ON "Task"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_task_company_project" ON "Task"("company", "project");
CREATE INDEX IF NOT EXISTS "idx_task_company_sprint" ON "Task"("company", "sprintId");
CREATE INDEX IF NOT EXISTS "idx_task_project_active_updated" ON "Task"("project", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_task_company_active_updated" ON "Task"("company", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_task_company_active_status_updated" ON "Task"("company", "status", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_task_status" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "idx_task_assignee" ON "Task"("assignee");
CREATE INDEX IF NOT EXISTS "idx_bug_company" ON "Bug"("company");
CREATE INDEX IF NOT EXISTS "idx_bug_company_updated" ON "Bug"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_bug_company_status" ON "Bug"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_bug_company_project" ON "Bug"("company", "project");
CREATE INDEX IF NOT EXISTS "idx_bug_company_module" ON "Bug"("company", "module");
CREATE INDEX IF NOT EXISTS "idx_bug_company_sprint" ON "Bug"("company", "sprintId");
CREATE INDEX IF NOT EXISTS "idx_bug_project_active_created" ON "Bug"("project", "createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_bug_company_active_updated" ON "Bug"("company", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_bug_company_active_created" ON "Bug"("company", "createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_bug_company_active_status_updated" ON "Bug"("company", "status", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_bug_status" ON "Bug"("status");
CREATE INDEX IF NOT EXISTS "idx_bug_suggesteddev" ON "Bug"("suggestedDev");
CREATE INDEX IF NOT EXISTS "idx_testcase_company" ON "TestCase"("company");
CREATE INDEX IF NOT EXISTS "idx_testcase_company_updated" ON "TestCase"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_testcase_company_status" ON "TestCase"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_testcase_company_suite" ON "TestCase"("company", "testSuiteId");
CREATE INDEX IF NOT EXISTS "idx_testcase_company_active_suite" ON "TestCase"("company", "testSuiteId", "id") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_testcase_assignee" ON "TestCase"("assignee");
CREATE INDEX IF NOT EXISTS "idx_testcase_status" ON "TestCase"("status");
CREATE INDEX IF NOT EXISTS "idx_testcase_suite" ON "TestCase"("testSuiteId");
  CREATE INDEX IF NOT EXISTS "idx_testplan_company" ON "TestPlan"("company");
  CREATE INDEX IF NOT EXISTS "idx_testplan_company_updated" ON "TestPlan"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_testplan_company_project" ON "TestPlan"("company", "project");
CREATE INDEX IF NOT EXISTS "idx_testplan_project_active_updated" ON "TestPlan"("project", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_testplan_company_sprint" ON "TestPlan"("company", "sprint");
CREATE INDEX IF NOT EXISTS "idx_testplan_company_status" ON "TestPlan"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_testplan_company_endDate" ON "TestPlan"("company", "endDate");
CREATE INDEX IF NOT EXISTS "idx_testplan_company_token" ON "TestPlan"("company", "publicToken");
CREATE INDEX IF NOT EXISTS "idx_testplan_company_active_updated" ON "TestPlan"("company", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_testplan_company_active_sprint" ON "TestPlan"("company", "sprint", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company" ON "TestSuite"("company");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company_updated" ON "TestSuite"("company", "updatedAt");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company_plan" ON "TestSuite"("company", "testPlanId");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company_status" ON "TestSuite"("company", "status");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_assignee" ON "TestSuite"("assignee");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company_token" ON "TestSuite"("company", "publicToken");
CREATE INDEX IF NOT EXISTS "idx_testsuite_plan_active_updated" ON "TestSuite"("testPlanId", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_testsuite_company_active_plan_updated" ON "TestSuite"("company", "testPlanId", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
  CREATE INDEX IF NOT EXISTS "idx_activitylog_company" ON "ActivityLog"("company");
  CREATE INDEX IF NOT EXISTS "idx_activitylog_company_created" ON "ActivityLog"("company", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_searchtoken_unique" ON "SearchToken"("company", "entityType", "entityId", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_searchtoken_lookup" ON "SearchToken"("company", "entityType", "entityIdInt", "token");
CREATE INDEX IF NOT EXISTS "idx_searchtoken_company_token" ON "SearchToken"("company", "entityType", "token");
  CREATE INDEX IF NOT EXISTS "idx_sprint_company" ON "Sprint"("company");
  CREATE INDEX IF NOT EXISTS "idx_sprint_company_updated" ON "Sprint"("company", "updatedAt");
  CREATE INDEX IF NOT EXISTS "idx_sprint_company_name" ON "Sprint"("company", "name");
CREATE INDEX IF NOT EXISTS "idx_sprint_company_status" ON "Sprint"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_sprint_company_start" ON "Sprint"("company", "startDate");
CREATE INDEX IF NOT EXISTS "idx_sprint_company_endDate" ON "Sprint"("company", "endDate");
CREATE INDEX IF NOT EXISTS "idx_sprint_name_active_start" ON "Sprint"("name", "startDate" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_sprint_company_active_start" ON "Sprint"("company", "startDate" DESC) WHERE "deletedAt" IS NULL;
  CREATE INDEX IF NOT EXISTS "idx_testcase_company_token" ON "TestCase"("company", "publicToken");
  CREATE INDEX IF NOT EXISTS "idx_testsession_company_scope_date" ON "TestSession"("company", "scope", "date");
CREATE INDEX IF NOT EXISTS "idx_testsession_scope_active_date" ON "TestSession"("scope", "date" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_testsession_company_active_scope_date" ON "TestSession"("company", "scope", "date" DESC) WHERE "deletedAt" IS NULL;
  CREATE INDEX IF NOT EXISTS "idx_meetingnote_company_updated" ON "MeetingNote"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_meetingnote_company_date" ON "MeetingNote"("company", "date");
CREATE INDEX IF NOT EXISTS "idx_meetingnote_company_token" ON "MeetingNote"("company", "publicToken");
CREATE INDEX IF NOT EXISTS "idx_meetingnote_company_project" ON "MeetingNote"("company", "project");
CREATE INDEX IF NOT EXISTS "idx_meetingnote_project_active_date" ON "MeetingNote"("project", "date" DESC, "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_meetingnote_company_active_date" ON "MeetingNote"("company", "date" DESC, "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_activitylog_company_created" ON "ActivityLog"("company", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_invite_company" ON "Invite"("company");
CREATE INDEX IF NOT EXISTS "idx_invite_token" ON "Invite"("token");
CREATE INDEX IF NOT EXISTS "idx_invite_company_status" ON "Invite"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_user_company_active_created" ON "User"("company", "createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "idx_assignee_userId" ON "Assignee"("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_assignee_company_updated" ON "Assignee"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_assignee_company_name" ON "Assignee"("company", "name");
CREATE INDEX IF NOT EXISTS "idx_assignee_company_status" ON "Assignee"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_assignee_company_active_updated" ON "Assignee"("company", "updatedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_deployment_company_updated" ON "Deployment"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_deployment_company_project" ON "Deployment"("company", "project");
CREATE INDEX IF NOT EXISTS "idx_deployment_project_active_date" ON "Deployment"("project", "date" DESC, "createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_deployment_company_status" ON "Deployment"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_deployment_company_date" ON "Deployment"("company", "date");
CREATE INDEX IF NOT EXISTS "idx_deployment_company_active_date" ON "Deployment"("company", "date" DESC, "createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_execrun_company_suite" ON "ExecutionRun"("company", "testSuiteId");
CREATE INDEX IF NOT EXISTS "idx_execrun_company_status" ON "ExecutionRun"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_execrun_suite_number" ON "ExecutionRun"("testSuiteId", "runNumber" DESC);
CREATE INDEX IF NOT EXISTS "idx_execrun_company_active" ON "ExecutionRun"("company", "startedAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "idx_caseverdict_run" ON "CaseVerdict"("executionRunId");
CREATE INDEX IF NOT EXISTS "idx_caseverdict_company_run" ON "CaseVerdict"("company", "executionRunId");
CREATE INDEX IF NOT EXISTS "idx_caseverdict_testcase" ON "CaseVerdict"("testCaseId");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_caseverdict_run_case" ON "CaseVerdict"("executionRunId", "testCaseId");
CREATE INDEX IF NOT EXISTS "idx_dashcomment_company_entity" ON "DashboardComment"("company", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "idx_dashcomment_company_created" ON "DashboardComment"("company", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_presence_user" ON "PresenceHeartbeat"("userId");
CREATE INDEX IF NOT EXISTS "idx_presence_company_lastseen" ON "PresenceHeartbeat"("company", "lastSeen");
CREATE INDEX IF NOT EXISTS "idx_dashfilter_company_user" ON "DashboardFilter"("company", "userId");
CREATE INDEX IF NOT EXISTS "idx_dashfilter_company_shared" ON "DashboardFilter"("company", "shared");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_dashfilter_unique_name" ON "DashboardFilter"("company", "userId", "name") WHERE "deletedAt" IS NULL;
`;

export function expandSchemaType(typeName: string, postgres: boolean) {
  if (typeName === "SERIAL_OR_PK") {
    return postgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
  }
  if (typeName === "DATE_TYPE") {
    return postgres ? "TIMESTAMP" : "TEXT";
  }
  if (typeName === "FK_INT_SPRINT") {
    return postgres ? "INTEGER" : 'INTEGER REFERENCES "Sprint"(id)';
  }
  return typeName;
}

function generateTableSchemaSql(postgres: boolean) {
  let sqlRows = postgres ? "" : "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;\n";

  for (const table of tables) {
    const s = table.schema
      .replace(/SERIAL_OR_PK|DATE_TYPE|FK_INT_SPRINT/g, (match) => expandSchemaType(match, postgres));

    sqlRows += `CREATE TABLE IF NOT EXISTS "${table.name}" (${s});\n`;
  }
  return sqlRows;
}

export const schemaTableSql = generateTableSchemaSql(isPostgres);
export const schemaIndexSql = indexSql;
export const schemaSql = `${schemaTableSql}${schemaIndexSql}`;
