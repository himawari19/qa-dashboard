const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const isPostgres = !!databaseUrl.startsWith("postgres");
const useSqlite = !isPostgres;

// Unified Tables Definition
const tables = [
  {
    name: "Sprint",
    schema: `
      id SERIAL_OR_PK,
      name TEXT NOT NULL,
      startDate TEXT,
      endDate TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "Requirement",
    schema: `
      id TEXT NOT NULL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'draft',
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "Task",
    schema: `
      id SERIAL_OR_PK,
      sprintId FK_INT_SPRINT,
      title TEXT NOT NULL,
      project TEXT NOT NULL,
      relatedFeature TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      dueDate TEXT,
      description TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      evidence TEXT NOT NULL DEFAULT '',
      relatedItems TEXT DEFAULT '',
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "Bug",
    schema: `
      id SERIAL_OR_PK,
      sprintId FK_INT_SPRINT,
      project TEXT NOT NULL,
      module TEXT NOT NULL,
      bugType TEXT NOT NULL,
      title TEXT NOT NULL,
      preconditions TEXT NOT NULL,
      stepsToReproduce TEXT NOT NULL,
      expectedResult TEXT NOT NULL,
      actualResult TEXT NOT NULL,
      severity TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      evidence TEXT NOT NULL DEFAULT '',
      relatedItems TEXT DEFAULT '',
      suggestedDev TEXT DEFAULT '',
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestCaseScenario",
    schema: `
      id TEXT NOT NULL PRIMARY KEY,
      requirementId FK_TEXT_REQ,
      projectName TEXT NOT NULL,
      moduleName TEXT NOT NULL,
      referenceDocument TEXT NOT NULL,
      traceability TEXT DEFAULT '',
      createdBy TEXT NOT NULL,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestCase",
    schema: `
      id SERIAL_OR_PK,
      testSuiteId TEXT NOT NULL DEFAULT '',
      tcId TEXT NOT NULL,
      typeCase TEXT NOT NULL,
      preCondition TEXT NOT NULL,
      caseName TEXT NOT NULL,
      testStep TEXT NOT NULL,
      expectedResult TEXT NOT NULL,
      actualResult TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      automationResult TEXT,
      lastRunAt TEXT,
      relatedItems TEXT DEFAULT '',
      deletedAt DATE_TYPE,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "MeetingNote",
    schema: `
      id SERIAL_OR_PK,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      project TEXT NOT NULL,
      participants TEXT NOT NULL,
      summary TEXT NOT NULL,
      decisions TEXT NOT NULL,
      actionItems TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      evidence TEXT NOT NULL DEFAULT '',
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "DailyLog",
    schema: `
      id SERIAL_OR_PK,
      date TEXT NOT NULL,
      project TEXT NOT NULL,
      whatTested TEXT NOT NULL,
      issuesFound TEXT NOT NULL,
      progressSummary TEXT NOT NULL,
      blockers TEXT NOT NULL DEFAULT '',
      nextPlan TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      evidence TEXT NOT NULL DEFAULT '',
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "ApiEndpoint",
    schema: `
      id SERIAL_OR_PK,
      title TEXT NOT NULL,
      method TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      payload TEXT,
      response TEXT,
      notes TEXT,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "ApiTestRun",
    schema: `
      id SERIAL_OR_PK,
      apiEndpointId INTEGER,
      title TEXT NOT NULL,
      method TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      requestBody TEXT,
      responseStatus TEXT NOT NULL,
      responseBody TEXT,
      error TEXT,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "WorkloadAssignment",
    schema: `
      id SERIAL_OR_PK,
      qaName TEXT NOT NULL,
      project TEXT NOT NULL,
      sprint TEXT NOT NULL,
      tasks TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "PerformanceBenchmark",
    schema: `
      id SERIAL_OR_PK,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      targetUrl TEXT NOT NULL,
      loadTime TEXT,
      score TEXT,
      notes TEXT,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "EnvConfig",
    schema: `
      id SERIAL_OR_PK,
      envName TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT,
      username TEXT,
      password TEXT,
      notes TEXT,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestPlan",
    schema: `
      id SERIAL_OR_PK,
      code TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      project TEXT NOT NULL,
      sprint TEXT NOT NULL,
      scope TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      startDate TEXT,
      endDate TEXT,
      assignee TEXT,
      notes TEXT,
      deletedAt DATE_TYPE,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestSession",
    schema: `
      id SERIAL_OR_PK,
      date TEXT NOT NULL,
      project TEXT NOT NULL,
      sprint TEXT NOT NULL,
      tester TEXT NOT NULL,
      scope TEXT NOT NULL,
      totalCases TEXT,
      passed TEXT,
      failed TEXT,
      blocked TEXT,
      result TEXT NOT NULL,
      notes TEXT,
      evidence TEXT,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "Checklist",
    schema: `
      id SERIAL_OR_PK,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      items TEXT NOT NULL,
      notes TEXT,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestSuite",
    schema: `
      id SERIAL_OR_PK,
      testPlanId TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT,
      deletedAt DATE_TYPE,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "SqlSnippet",
    schema: `
      id SERIAL_OR_PK,
      title TEXT NOT NULL,
      project TEXT NOT NULL,
      query TEXT NOT NULL,
      notes TEXT,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestingAsset",
    schema: `
      id SERIAL_OR_PK,
      title TEXT NOT NULL,
      project TEXT NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "StandupLog",
    schema: `
      id SERIAL_OR_PK,
      date DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      content TEXT NOT NULL,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "ActivityLog",
    schema: `
      id SERIAL_OR_PK,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      action TEXT NOT NULL,
      summary TEXT NOT NULL,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  }
];

function generateSchemaSql(postgres: boolean) {
  let sqlRows = postgres ? "" : "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;\n";
  
  for (const table of tables) {
    const s = table.schema
      .replace(/SERIAL_OR_PK/g, postgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT")
      .replace(/DATE_TYPE/g, postgres ? "TIMESTAMP" : "TEXT")
      .replace(/FK_INT_SPRINT/g, postgres ? "INTEGER" : 'INTEGER REFERENCES "Sprint"(id)')
      .replace(/FK_TEXT_REQ/g, postgres ? "TEXT" : 'TEXT REFERENCES "Requirement"(id)');
    
    sqlRows += `CREATE TABLE IF NOT EXISTS "${table.name}" (${s});\n`;
  }
  return sqlRows;
}

const schemaSql = generateSchemaSql(isPostgres);

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
  // Keep quoted PascalCase table names (e.g. "Task"), normalize quoted
  // camelCase column identifiers (e.g. "updatedAt") to postgres-safe lowercase.
  return queryStr.replace(/"([a-z][a-zA-Z0-9_]*)"/g, (_, identifier: string) => identifier.toLowerCase());
}

function toPostgresQuery(queryStr: string) {
  let pgQuery = normalizePostgresQuery(queryStr);
  if (pgQuery.includes("?")) {
    let count = 0;
    pgQuery = pgQuery.replace(/\?/g, () => `$${++count}`);
  }
  return pgQuery;
}

const globalForDb = globalThis as unknown as {
  sqliteDb?: unknown;
  neonSql?: unknown;
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
    const { DatabaseSync } = await import("node:sqlite");
    const path = await import("node:path");
    const fs = await import("node:fs");
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

let schemaInitPromise: Promise<void> | null = null;

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
      const rawColumn = def.slice(0, firstSpace).trim();
      const columnType = def.slice(firstSpace + 1).trim().split(/\s+/)[0] || "TEXT";
      try {
        const exists = sqlite.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).all(rawColumn) as any[];
        if (exists.length === 0) {
          sqlite.prepare(`ALTER TABLE "${table}" ADD COLUMN ${rawColumn} ${columnType}`).run();
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
    const columnType = def.slice(firstSpace + 1).trim().split(/\s+/)[0] || "TEXT";
    try {
      await pool.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS ${rawColumn.toLowerCase()} ${columnType}`);
    } catch {
      // keep startup resilient
    }
  }
}

async function ensureSchema() {
  if (typeof window !== 'undefined') return;
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      try {
        if (useSqlite) {
          await getSqlite();
        } else {
          await db.exec(schemaSql);
        }
        
        await applyMissingColumns();
      } catch (err) {
        schemaInitPromise = null;
        if (databaseUrl || useSqlite) {
          console.error("Schema init error:", err);
        }
      }
    })();
  }
  return schemaInitPromise;
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
          await pool.query(s);
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
