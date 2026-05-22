import {
  databaseUrl,
  schemaTableSql,
  tables,
} from "@/lib/db-schema";
import {
  buildSequentialInsert,
  isSequentialIdConflict,
  parseInsertStatement,
  toPostgresQuery,
  type PostgresPool,
} from "@/lib/db-query-utils";
import { ensureSchemaBootstrap } from "@/lib/db-bootstrap";

export { databaseUrl, schemaIndexSql, schemaSql, schemaTableSql, tables } from "@/lib/db-schema";

const globalForDb = globalThis as unknown as {
  pgPool?: unknown;
  schemaInitPromise?: Promise<void>;
  schemaReady?: boolean;
};

async function getPostgresPool() {
  if (!globalForDb.pgPool) {
    const isNeon = databaseUrl.includes("neon.tech") || databaseUrl.includes("neon-");
    const poolConfig = {
      connectionString: databaseUrl,
      max: isNeon ? 10 : 20,
      min: isNeon ? 0 : 2,
      idleTimeoutMillis: isNeon ? 10000 : 30000,
      connectionTimeoutMillis: isNeon ? 10000 : 5000,
      allowExitOnIdle: isNeon,
    };
    let pool;
    if (isNeon) {
      const { Pool } = await import("@neondatabase/serverless");
      pool = new Pool(poolConfig);
    } else {
      const { Pool } = await import("pg");
      pool = new Pool(poolConfig);
    }
    pool.on("error", (err: Error) => {
      console.error("[DB Pool] Unexpected error on idle client:", err.message);
    });
    globalForDb.pgPool = pool;
  }
  return globalForDb.pgPool as PostgresPool;
}

async function ensureSchema() {
  if (globalForDb.schemaReady) return;
  await ensureSchemaBootstrap({
    getPostgresPool,
    getSchemaInitPromise: () => globalForDb.schemaInitPromise,
    setSchemaInitPromise: (value) => {
      globalForDb.schemaInitPromise = value;
    },
  });
  globalForDb.schemaReady = true;
}

async function queryRaw<T>(queryStr: string, params: unknown[] = []): Promise<T[]> {
  const pool = await getPostgresPool();
  const pgQuery = toPostgresQuery(queryStr);
  const { rows } = await pool.query(pgQuery, params);
  return rows as T[];
}

async function runRaw(queryStr: string, params: unknown[] = []): Promise<void> {
  const pool = await getPostgresPool();
  const pgQuery = toPostgresQuery(queryStr);
  await pool.query(pgQuery, params);
}

async function execRaw(queryStr: string): Promise<void> {
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

const MAX_INSERT_RETRIES = 3;

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
    const parsedInsert = parseInsertStatement(queryStr);
    if (parsedInsert) {
      for (let attempt = 0; attempt < MAX_INSERT_RETRIES; attempt++) {
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
      }
      const finalId = await getNextSequentialId(parsedInsert.table);
      const finalInsert = buildSequentialInsert(queryStr, params, finalId);
      await runRaw(finalInsert.queryStr, finalInsert.params);
      return;
    }

    await runRaw(queryStr, params);
  },

  async exec(queryStr: string): Promise<void> {
    await execRaw(queryStr);
  },

  async transaction<T>(fn: (client?: unknown) => Promise<T>): Promise<T> {
    await ensureSchema();
    const pool = await getPostgresPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

export async function resetTables() {
  const tableNames = tables.map((table) => `"${table.name}"`);
  await db.exec(`TRUNCATE ${tableNames.join(", ")} RESTART IDENTITY CASCADE;`);
}

