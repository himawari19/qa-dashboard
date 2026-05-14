import {
  databaseUrl,
  isPostgres,
  schemaIndexSql,
  schemaSql,
  schemaTableSql,
  tables,
  useSqlite,
} from "@/lib/db-schema";
import {
  buildSequentialInsert,
  isSequentialIdConflict,
  parseInsertStatement,
  toPostgresQuery,
  type PostgresPool,
  type SqliteDatabase,
} from "@/lib/db-query-utils";
import { ensureSchemaBootstrap } from "@/lib/db-bootstrap";

export { databaseUrl, isPostgres, schemaIndexSql, schemaSql, schemaTableSql, tables, useSqlite } from "@/lib/db-schema";

const globalForDb = globalThis as unknown as {
  sqliteDb?: unknown;
  neonSql?: unknown;
  schemaInitPromise?: Promise<void>;
};

async function getPostgresPool() {
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  neonConfig.fetchConnectionCache = true;
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
    sqliteDb.exec(schemaTableSql);
    globalForDb.sqliteDb = sqliteDb;
  }
  return globalForDb.sqliteDb as SqliteDatabase;
}

async function ensureSchema() {
  return ensureSchemaBootstrap({
    getSqlite,
    getPostgresPool,
    getSchemaInitPromise: () => globalForDb.schemaInitPromise,
    setSchemaInitPromise: (value) => {
      globalForDb.schemaInitPromise = value;
    },
  });
}

async function queryRaw<T>(queryStr: string, params: unknown[] = []): Promise<T[]> {
  if (useSqlite) {
    const sqlite = await getSqlite();
    try {
      return sqlite.prepare(queryStr).all(...params) as T[];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('no such column: deletedAt') ||
        message.includes('no such column: "deletedAt"') ||
        message.includes('no such column: acceptanceCriteria') ||
        message.includes('no such column: "acceptanceCriteria"') ||
        message.includes('no such column: relatedItems') ||
        message.includes('no such column: "relatedItems"') ||
        message.includes('no such column: sortOrder') ||
        message.includes('no such column: "sortOrder"')
      ) {
        await ensureSchema();
        return sqlite.prepare(queryStr).all(...params) as T[];
      }
      throw error;
    }
  }

  const pool = await getPostgresPool();
  const pgQuery = toPostgresQuery(queryStr);
  const { rows } = await pool.query(pgQuery, params);
  return rows as T[];
}

async function runRaw(queryStr: string, params: unknown[] = []): Promise<void> {
  if (useSqlite) {
    const sqlite = await getSqlite();
    sqlite.prepare(queryStr).run(...params);
    return;
  }

  const pool = await getPostgresPool();
  const pgQuery = toPostgresQuery(queryStr);
  await pool.query(pgQuery, params);
}

async function execRaw(queryStr: string): Promise<void> {
  if (useSqlite) {
    const sqlite = await getSqlite();
    sqlite.exec(queryStr);
    return;
  }

  const pool = await getPostgresPool();
  const statements = queryStr.split(";").filter((s) => s.trim());
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

async function getNextSequentialId(table: string) {
  const row = await queryRaw<{ maxId: number | string | null }>(
    `SELECT MAX("id") as "maxId" FROM "${table}"`,
  );
  const maxId = Number(row[0]?.maxId ?? 0);
  return (Number.isFinite(maxId) && maxId > 0) ? maxId + 1 : 1;
}

export const db = {
  async query<T>(queryStr: string, params: unknown[] = []): Promise<T[]> {
    await ensureSchema();
    return queryRaw<T>(queryStr, params);
  },

  async get<T>(queryStr: string, params: unknown[] = []): Promise<T | undefined> {
    const rows = await db.query<T>(queryStr, params);
    return rows[0];
  },

  async run(queryStr: string, params: unknown[] = []): Promise<void> {
    await ensureSchema();
    if (!useSqlite) {
      const parsedInsert = parseInsertStatement(queryStr);
      if (parsedInsert) {
        const nextId = await getNextSequentialId(parsedInsert.table);
        const rewritten = buildSequentialInsert(queryStr, params, nextId);
        try {
          await runRaw(rewritten.queryStr, rewritten.params);
          return;
        } catch (err) {
          if (!isSequentialIdConflict(err, parsedInsert.table)) {
            throw err;
          }
        }

        const retryNextId = await getNextSequentialId(parsedInsert.table);
        const retryInsert = buildSequentialInsert(queryStr, params, retryNextId);
        await runRaw(retryInsert.queryStr, retryInsert.params);
        return;
      }
    }

    await runRaw(queryStr, params);
  },

  async exec(queryStr: string): Promise<void> {
    await execRaw(queryStr);
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
    }

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
  },
};

export async function resetTables() {
  const tableNames = tables.map((table) => `"${table.name}"`);
  if (useSqlite) {
    await db.exec("PRAGMA foreign_keys = OFF");
    for (const name of tableNames) {
      await db.run(`DELETE FROM ${name}`);
      await db.run(`DELETE FROM sqlite_sequence WHERE name = ${name.replace(/"/g, "'")}`);
    }
    await db.exec("PRAGMA foreign_keys = ON");
    return;
  }

  await db.exec(`TRUNCATE ${tableNames.join(", ")} RESTART IDENTITY CASCADE;`);
}
