import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// Detect environment
const isPostgres = !!process.env.POSTGRES_URL || !!process.env.DATABASE_URL?.startsWith("postgres");
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

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
      sprintId INTEGER REFERENCES_SPRINT,
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
      sprintId INTEGER REFERENCES_SPRINT,
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
      requirementId TEXT REFERENCES_REQ,
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
      scenarioId TEXT NOT NULL,
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
      title TEXT NOT NULL,
      project TEXT NOT NULL,
      sprint TEXT NOT NULL,
      scope TEXT NOT NULL,
      startDate TEXT,
      endDate TEXT,
      assignee TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT,
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
      title TEXT NOT NULL,
      project TEXT NOT NULL,
      caseIds TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      notes TEXT,
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
  }
];

function generateSchemaSql(postgres: boolean) {
  let sqlRows = postgres ? "" : "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;\n";
  
  for (const table of tables) {
    let s = table.schema
      .replace(/SERIAL_OR_PK/g, postgres ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT")
      .replace(/DATE_TYPE/g, postgres ? "TIMESTAMP" : "TEXT")
      .replace(/REFERENCES_SPRINT/g, postgres ? "INTEGER" : 'INTEGER REFERENCES "Sprint"(id)')
      .replace(/REFERENCES_REQ/g, postgres ? "TEXT" : 'TEXT REFERENCES "Requirement"(id)');
    
    sqlRows += `CREATE TABLE IF NOT EXISTS "${table.name}" (${s});\n`;
  }
  return sqlRows;
}

const schemaSql = generateSchemaSql(isPostgres);

const globalForDb = globalThis as unknown as {
  sqliteDb?: any;
  neonSql?: any;
};

async function getPostgresPool() {
  const { Pool } = await import("@neondatabase/serverless");
  if (!globalForDb.neonSql) {
    globalForDb.neonSql = new Pool({ connectionString: databaseUrl });
  }
  return globalForDb.neonSql;
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
    
    globalForDb.sqliteDb = new DatabaseSync(databasePath);
    globalForDb.sqliteDb.exec(schemaSql);
  }
  return globalForDb.sqliteDb;
}

export const db = {
  async query<T>(queryStr: string, params: any[] = []): Promise<T[]> {
    if (isPostgres) {
      const pool = await getPostgresPool();
      let pgQuery = queryStr;
      if (queryStr.includes('?')) {
        let count = 0;
        pgQuery = queryStr.replace(/\?/g, () => `$${++count}`);
      }
      const { rows } = await pool.query(pgQuery, params);
      return rows as T[];
    } else {
      const sqlite = await getSqlite();
      return sqlite.prepare(queryStr).all(...params) as T[];
    }
  },

  async get<T>(queryStr: string, params: any[] = []): Promise<T | undefined> {
    const rows = await this.query<T>(queryStr, params);
    return rows[0];
  },

  async run(queryStr: string, params: any[] = []): Promise<void> {
    if (isPostgres) {
      await this.query(queryStr, params);
    } else {
      const sqlite = await getSqlite();
      sqlite.prepare(queryStr).run(...params);
    }
  },

  async exec(queryStr: string): Promise<void> {
    if (isPostgres) {
      const pool = await getPostgresPool();
      const statements = queryStr.split(';').filter(s => s.trim());
      for (const s of statements) {
        await pool.query(s);
      }
    } else {
      const sqlite = await getSqlite();
      sqlite.exec(queryStr);
    }
  }
};

// Auto-init schema if on server
if (typeof window === 'undefined') {
  db.exec(schemaSql).catch(err => {
    if (!databaseUrl && isPostgres) {
      // Quietly skip if no URL
    } else {
      console.error("Schema init error:", err);
    }
  });
}

export async function resetTables() {
  const tableNames = tables.map(t => `"${t.name}"`);
  if (isPostgres) {
    await db.exec(`TRUNCATE ${tableNames.join(", ")} RESTART IDENTITY;`);
  } else {
    for (const name of tableNames) {
      await db.run(`DELETE FROM ${name}`);
      await db.run(`DELETE FROM sqlite_sequence WHERE name = ${name.replace(/"/g, "'")}`);
    }
  }
}
