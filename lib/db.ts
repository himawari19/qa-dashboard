import { randomBytes } from "crypto";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const isPostgres = !!databaseUrl.startsWith("postgres");
const useSqlite = !isPostgres;

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
      "notes" TEXT NOT NULL DEFAULT '',
      "evidence" TEXT NOT NULL DEFAULT '',
      "relatedItems" TEXT DEFAULT '',
      "assignee" TEXT DEFAULT '',
      "attachments" TEXT DEFAULT '',
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
      "testStep" TEXT NOT NULL,
      "expectedResult" TEXT NOT NULL,
      "actualResult" TEXT DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'Pending',
      "automationResult" TEXT,
      "evidence" TEXT DEFAULT '',
      "priority" TEXT DEFAULT 'Medium',
      "lastRunAt" TEXT,
      "relatedItems" TEXT DEFAULT '',
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
      "createdAt" DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
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
      "actionItems" TEXT NOT NULL DEFAULT '',
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
      "name" TEXT NOT NULL,
      "role" TEXT,
      "email" TEXT,
      "skills" TEXT DEFAULT '',
      "status" TEXT NOT NULL DEFAULT 'active',
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
      "username" TEXT NOT NULL UNIQUE,
      "email" TEXT UNIQUE,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'user',
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
      "role" TEXT NOT NULL DEFAULT 'viewer',
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
CREATE INDEX IF NOT EXISTS "idx_task_status" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "idx_task_assignee" ON "Task"("assignee");
CREATE INDEX IF NOT EXISTS "idx_bug_company" ON "Bug"("company");
CREATE INDEX IF NOT EXISTS "idx_bug_company_updated" ON "Bug"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_bug_company_status" ON "Bug"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_bug_company_project" ON "Bug"("company", "project");
CREATE INDEX IF NOT EXISTS "idx_bug_company_module" ON "Bug"("company", "module");
CREATE INDEX IF NOT EXISTS "idx_bug_company_sprint" ON "Bug"("company", "sprintId");
CREATE INDEX IF NOT EXISTS "idx_bug_status" ON "Bug"("status");
CREATE INDEX IF NOT EXISTS "idx_bug_suggesteddev" ON "Bug"("suggestedDev");
CREATE INDEX IF NOT EXISTS "idx_testcase_company" ON "TestCase"("company");
CREATE INDEX IF NOT EXISTS "idx_testcase_company_updated" ON "TestCase"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_testcase_company_status" ON "TestCase"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_testcase_company_suite" ON "TestCase"("company", "testSuiteId");
CREATE INDEX IF NOT EXISTS "idx_testcase_status" ON "TestCase"("status");
CREATE INDEX IF NOT EXISTS "idx_testcase_suite" ON "TestCase"("testSuiteId");
  CREATE INDEX IF NOT EXISTS "idx_testplan_company" ON "TestPlan"("company");
  CREATE INDEX IF NOT EXISTS "idx_testplan_company_updated" ON "TestPlan"("company", "updatedAt");
  CREATE INDEX IF NOT EXISTS "idx_testplan_company_project" ON "TestPlan"("company", "project");
  CREATE INDEX IF NOT EXISTS "idx_testplan_company_sprint" ON "TestPlan"("company", "sprint");
  CREATE INDEX IF NOT EXISTS "idx_testplan_company_status" ON "TestPlan"("company", "status");
  CREATE INDEX IF NOT EXISTS "idx_testplan_company_token" ON "TestPlan"("company", "publicToken");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company" ON "TestSuite"("company");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company_updated" ON "TestSuite"("company", "updatedAt");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company_plan" ON "TestSuite"("company", "testPlanId");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company_status" ON "TestSuite"("company", "status");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_assignee" ON "TestSuite"("assignee");
  CREATE INDEX IF NOT EXISTS "idx_testsuite_company_token" ON "TestSuite"("company", "publicToken");
  CREATE INDEX IF NOT EXISTS "idx_activitylog_company" ON "ActivityLog"("company");
  CREATE INDEX IF NOT EXISTS "idx_activitylog_company_created" ON "ActivityLog"("company", "createdAt");
  CREATE INDEX IF NOT EXISTS "idx_sprint_company" ON "Sprint"("company");
  CREATE INDEX IF NOT EXISTS "idx_sprint_company_updated" ON "Sprint"("company", "updatedAt");
  CREATE INDEX IF NOT EXISTS "idx_sprint_company_name" ON "Sprint"("company", "name");
  CREATE INDEX IF NOT EXISTS "idx_sprint_company_status" ON "Sprint"("company", "status");
  CREATE INDEX IF NOT EXISTS "idx_sprint_company_start" ON "Sprint"("company", "startDate");
  CREATE INDEX IF NOT EXISTS "idx_testcase_company_token" ON "TestCase"("company", "publicToken");
  CREATE INDEX IF NOT EXISTS "idx_testsession_company_scope_date" ON "TestSession"("company", "scope", "date");
  CREATE INDEX IF NOT EXISTS "idx_meetingnote_company_updated" ON "MeetingNote"("company", "updatedAt");
  CREATE INDEX IF NOT EXISTS "idx_meetingnote_company_date" ON "MeetingNote"("company", "date");
  CREATE INDEX IF NOT EXISTS "idx_meetingnote_company_token" ON "MeetingNote"("company", "publicToken");
  CREATE INDEX IF NOT EXISTS "idx_meetingnote_company_project" ON "MeetingNote"("company", "project");
CREATE INDEX IF NOT EXISTS "idx_invite_company" ON "Invite"("company");
CREATE INDEX IF NOT EXISTS "idx_invite_token" ON "Invite"("token");
CREATE INDEX IF NOT EXISTS "idx_invite_company_status" ON "Invite"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_assignee_company_updated" ON "Assignee"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_assignee_company_name" ON "Assignee"("company", "name");
CREATE INDEX IF NOT EXISTS "idx_assignee_company_status" ON "Assignee"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_deployment_company_updated" ON "Deployment"("company", "updatedAt");
CREATE INDEX IF NOT EXISTS "idx_deployment_company_project" ON "Deployment"("company", "project");
CREATE INDEX IF NOT EXISTS "idx_deployment_company_status" ON "Deployment"("company", "status");
CREATE INDEX IF NOT EXISTS "idx_deployment_company_date" ON "Deployment"("company", "date");
`;

function expandSchemaType(typeName: string, postgres: boolean) {
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

function generateSchemaSql(postgres: boolean) {
  let sqlRows = postgres ? "" : "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;\n";

  for (const table of tables) {
    const s = table.schema
      .replace(/SERIAL_OR_PK|DATE_TYPE|FK_INT_SPRINT/g, (match) => expandSchemaType(match, postgres));

    sqlRows += `CREATE TABLE IF NOT EXISTS "${table.name}" (${s});\n`;
  }
  sqlRows += indexSql;
  return sqlRows;
}

export const schemaSql = generateSchemaSql(isPostgres);

type PostgresPool = {
  query: (queryText: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

type SqliteDatabase = {
  exec: (queryText: string) => void;
  prepare: (queryText: string) => {
    all: (...params: unknown[]) => unknown[];
    run: (...params: unknown[]) => unknown;
  };
};

function normalizePostgresQuery(queryStr: string) {
  // We should NOT strip all quotes, as Postgres table names can be case-sensitive if quoted during creation.
  // We only normalize known Postgres-specific syntax replacements here if needed.
  return queryStr;
}

function toPostgresQuery(queryStr: string) {
  let pgQuery = normalizePostgresQuery(queryStr);
  pgQuery = pgQuery
    .replace(/DATE\('now'\)/gi, "CURRENT_DATE")
    .replace(/DATE\('now',\s*'-(\d+)\s+days'\)/gi, (_, d) => `CURRENT_DATE - INTERVAL '${d} days'`)
    .replace(/DATE\('now',\s*'\+(\d+)\s+days'\)/gi, (_, d) => `CURRENT_DATE + INTERVAL '${d} days'`)
    .replace(/DATE\(([^'()\s][^()]*)\)/gi, (_, col) => `(${col.trim()})::date`);
  if (pgQuery.includes("?")) {
    let count = 0;
    pgQuery = pgQuery.replace(/\?/g, () => `$${++count}`);
  }
  return pgQuery;
}

const globalForDb = globalThis as unknown as {
  sqliteDb?: unknown;
  neonSql?: unknown;
  schemaInitPromise?: Promise<void>;
};

async function getPostgresPool() {
  const { Pool } = await import("@neondatabase/serverless");
  if (!globalForDb.neonSql) {
    globalForDb.neonSql = new Pool({ connectionString: databaseUrl });
  }
  return globalForDb.neonSql as PostgresPool;
}

async function getSqlite() {
  if (!globalForDb.sqliteDb) {
    const { DatabaseSync } = await (eval('import("node:sqlite")') as Promise<any>);
    const path = await (eval('import("node:path")') as Promise<any>);
    const fs = await (eval('import("node:fs")') as Promise<any>);
    const databasePath = path.join(process.cwd(), "prisma", "dev.db");
    
    if (!fs.existsSync(path.dirname(databasePath))) {
      fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    }
    
    const sqliteDb = new DatabaseSync(databasePath);
    sqliteDb.exec(schemaSql);
    globalForDb.sqliteDb = sqliteDb;
  }
  return globalForDb.sqliteDb as SqliteDatabase;
}

async function applyMissingColumns() {
  const columnQueries = tables.flatMap((table) =>
    table.schema
      .split("\n")
      .map((line) => line.trim().replace(/,$/, ""))
      .filter(Boolean)
      .map((def) => ({ table: table.name, def })),
  );

  if (useSqlite) {
    const sqlite = await getSqlite();
    for (const { table, def } of columnQueries) {
      if (def.startsWith("PRIMARY") || def.startsWith("FOREIGN") || def.startsWith("id ")) continue;
      const firstSpace = def.indexOf(" ");
      if (firstSpace <= 0) continue;
      let rawColumn = def.slice(0, firstSpace).trim();
      const rawType = def.slice(firstSpace + 1).trim().split(/\s+/)[0] || "TEXT";
      
      // Strip quotes for checking
      const columnName = rawColumn.replace(/"/g, "");
      
      const columnType = rawType
        .replace(/SERIAL_OR_PK|DATE_TYPE|FK_INT_SPRINT/g, (match) => expandSchemaType(match, !useSqlite));
      try {
        const exists = sqlite.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).all(columnName) as any[];
        if (exists.length === 0) {
          sqlite.prepare(`ALTER TABLE "${table}" ADD COLUMN "${columnName}" ${columnType}`).run();
        }
      } catch {
        // keep startup resilient
      }
    }
    return;
  }

  const pool = await getPostgresPool();
  for (const { table, def } of columnQueries) {
    if (def.startsWith("PRIMARY") || def.startsWith("FOREIGN") || def.startsWith("id ")) continue;
    const firstSpace = def.indexOf(" ");
    if (firstSpace <= 0) continue;
    const rawColumn = def.slice(0, firstSpace).trim();
    const rawType = def.slice(firstSpace + 1).trim().split(/\s+/)[0] || "TEXT";
    
    // Strip quotes
    const columnName = rawColumn.replace(/"/g, "");
    
    try {
      await pool.query(toPostgresQuery(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${columnName}" ${expandSchemaType(rawType, true)}`));
    } catch {
      // keep startup resilient
    }
  }
}

async function backfillPublicTokens() {
  const tablesToFill = [
    { table: "TestPlan", column: "publicToken" },
    { table: "TestSuite", column: "publicToken" },
    { table: "TestCase", column: "publicToken" },
    { table: "MeetingNote", column: "publicToken" },
  ];
  for (const { table, column } of tablesToFill) {
    if (useSqlite) {
      const sqlite = await getSqlite();
      const rows = sqlite.prepare(`SELECT id FROM "${table}" WHERE COALESCE(${column}, '') = ''`).all() as Array<{ id: string | number }>;
      for (const row of rows) {
        sqlite.prepare(`UPDATE "${table}" SET ${column} = ? WHERE id = ?`).run(randomBytes(16).toString("base64url"), row.id);
      }
    } else {
      const pool = await getPostgresPool();
      const rows = await pool.query(toPostgresQuery(`SELECT id FROM "${table}" WHERE COALESCE("${column}", '') = ''`));
      for (const row of rows.rows as Array<{ id: string | number }>) {
        await pool.query(toPostgresQuery(`UPDATE "${table}" SET "${column}" = $1 WHERE id = $2`), [randomBytes(16).toString("base64url"), row.id]);
      }
    }
  }
}

async function ensureSchema() {
  if (typeof window !== 'undefined') return;
  if (!globalForDb.schemaInitPromise) {
    globalForDb.schemaInitPromise = (async () => {
      try {
        if (useSqlite) {
          await getSqlite();
        } else {
          await db.exec(schemaSql);
        }
        
        await applyMissingColumns();
        await backfillPublicTokens();
      } catch (err) {
        globalForDb.schemaInitPromise = undefined;
        if (databaseUrl || useSqlite) {
          console.error("Schema init error:", err);
        }
      }
    })();
  }
  return globalForDb.schemaInitPromise;
}

export const db = {
  async query<T>(queryStr: string, params: unknown[] = []): Promise<T[]> {
    await ensureSchema();
    if (useSqlite) {
      const sqlite = await getSqlite();
      return sqlite.prepare(queryStr).all(...params) as T[];
    } else {
      const pool = await getPostgresPool();
      const pgQuery = toPostgresQuery(queryStr);
      const { rows } = await pool.query(pgQuery, params);
      return rows as T[];
    }
  },

  async get<T>(queryStr: string, params: unknown[] = []): Promise<T | undefined> {
    const rows = await this.query<T>(queryStr, params);
    return rows[0];
  },

  async run(queryStr: string, params: unknown[] = []): Promise<void> {
    await ensureSchema();
    if (useSqlite) {
      const sqlite = await getSqlite();
      sqlite.prepare(queryStr).run(...params);
    } else {
      const pool = await getPostgresPool();
      const pgQuery = toPostgresQuery(queryStr);
      await pool.query(pgQuery, params);
    }
  },

  async exec(queryStr: string): Promise<void> {
    if (useSqlite) {
      const sqlite = await getSqlite();
      sqlite.exec(queryStr);
    } else {
      const pool = await getPostgresPool();
      const statements = queryStr.split(';').filter(s => s.trim());
      for (const s of statements) {
        try {
          await pool.query(toPostgresQuery(s));
        } catch (err: unknown) {
          if (
            typeof err === "object" &&
            err !== null &&
            "code" in err &&
            (err.code === "42P07" || err.code === "23505")
          ) {
            continue;
          }
          throw err;
        }
      }
    }
  },

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    await ensureSchema();
    if (useSqlite) {
      const sqlite = await getSqlite();
      sqlite.exec("BEGIN");
      try {
        const result = await fn();
        sqlite.exec("COMMIT");
        return result;
      } catch (err) {
        sqlite.exec("ROLLBACK");
        throw err;
      }
    } else {
      const pool = await getPostgresPool();
      await pool.query("BEGIN");
      try {
        const result = await fn();
        await pool.query("COMMIT");
        return result;
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
    }
  }
};

export async function resetTables() {
  const tableNames = tables.map(t => `"${t.name}"`);
  if (useSqlite) {
    for (const name of tableNames) {
      await db.run(`DELETE FROM ${name}`);
      await db.run(`DELETE FROM sqlite_sequence WHERE name = ${name.replace(/"/g, "'")}`);
    }
  } else {
    await db.exec(`TRUNCATE ${tableNames.join(", ")} RESTART IDENTITY;`);
  }
}
