import { randomBytes } from "crypto";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const isPostgres = !!databaseUrl.startsWith("postgres");
const useSqlite = !isPostgres;

// Core QA Tables Definition
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
    name: "TestCase",
    schema: `
      id SERIAL_OR_PK,
      publicToken TEXT NOT NULL DEFAULT '',
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
      evidence TEXT,
      priority TEXT DEFAULT 'Medium',
      lastRunAt TEXT,
      relatedItems TEXT DEFAULT '',
      deletedAt DATE_TYPE,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
    `
  },
  {
    name: "TestPlan",
    schema: `
      id SERIAL_OR_PK,
      publicToken TEXT NOT NULL DEFAULT '',
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
    name: "TestSuite",
    schema: `
      id SERIAL_OR_PK,
      publicToken TEXT NOT NULL DEFAULT '',
      testPlanId TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      assignee TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT,
      deletedAt DATE_TYPE,
      createdAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATE_TYPE NOT NULL DEFAULT CURRENT_TIMESTAMP
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
      .replace(/FK_INT_SPRINT/g, postgres ? "INTEGER" : 'INTEGER REFERENCES "Sprint"(id)');
    
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
  // Strip quotes to let Postgres handle identifiers case-insensitively (lowercasing them automatically)
  // This ensures compatibility even if tables were created as lowercase.
  return queryStr.replace(/"/g, "");
}

function toPostgresQuery(queryStr: string) {
  let pgQuery = normalizePostgresQuery(queryStr);
  pgQuery = pgQuery.replace(/DATE\('now'\)/gi, "CURRENT_DATE")
                   .replace(/DATE\('now',\s*'-(\d+)\s+days'\)/gi, (_, d) => `CURRENT_DATE - INTERVAL '${d} days'`);
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
      const rawColumn = def.slice(0, firstSpace).trim();
      const rawType = def.slice(firstSpace + 1).trim().split(/\s+/)[0] || "TEXT";
      const columnType = rawType
        .replace(/DATE_TYPE/g, useSqlite ? "TEXT" : "TIMESTAMP")
        .replace(/SERIAL_OR_PK/g, useSqlite ? "INTEGER" : "SERIAL");
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
      await pool.query(toPostgresQuery(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${rawColumn}" ${columnType}`));
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
  ];
  for (const { table, column } of tablesToFill) {
    if (useSqlite) {
      const sqlite = await getSqlite();
      const rows = sqlite.prepare(`SELECT id FROM "${table}" WHERE COALESCE(${column}, '') = ''`).all() as Array<{ id: string | number }>;
      for (const row of rows) {
        sqlite.prepare(`UPDATE "${table}" SET ${column} = ? WHERE id = ?`).run(randomBytes(8).toString("base64url"), row.id);
      }
    } else {
      const pool = await getPostgresPool();
      const rows = await pool.query(toPostgresQuery(`SELECT id FROM "${table}" WHERE COALESCE("${column}", '') = ''`));
      for (const row of rows.rows as Array<{ id: string | number }>) {
        await pool.query(toPostgresQuery(`UPDATE "${table}" SET "${column}" = $1 WHERE id = $2`), [randomBytes(8).toString("base64url"), row.id]);
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
