import { randomBytes } from "crypto";
import { databaseUrl, schemaIndexSql, schemaTableSql, tables, useSqlite, expandSchemaType } from "@/lib/db-schema";
import { toPostgresQuery, type PostgresPool, type SqliteDatabase } from "@/lib/db-query-utils";

export type DbBootstrapDeps = {
  getSqlite: () => Promise<SqliteDatabase>;
  getPostgresPool: () => Promise<PostgresPool>;
  getSchemaInitPromise: () => Promise<void> | undefined;
  setSchemaInitPromise: (value: Promise<void> | undefined) => void;
};

async function execSchemaSql(queryStr: string, deps: DbBootstrapDeps) {
  if (useSqlite) {
    const sqlite = await deps.getSqlite();
    sqlite.exec(queryStr);
    return;
  }

  const pool = await deps.getPostgresPool();
  const statements = queryStr.split(";").filter((s) => s.trim());
  await Promise.all(
    statements.map(async (s) => {
      try {
        await pool.query(toPostgresQuery(s));
      } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err.code === "42P07" || err.code === "23505")
        ) {
          return;
        }
      }
    }),
  );
}

async function applyMissingColumns(deps: DbBootstrapDeps) {
  const columnQueries = tables.flatMap((table) =>
    table.schema
      .split("\n")
      .map((line) => line.trim().replace(/,$/, ""))
      .filter(Boolean)
      .map((def) => ({ table: table.name, def })),
  );

  if (useSqlite) {
    const sqlite = await deps.getSqlite();
    for (const { table, def } of columnQueries) {
      if (def.startsWith("PRIMARY") || def.startsWith("FOREIGN") || def.startsWith("id ")) continue;
      const firstSpace = def.indexOf(" ");
      if (firstSpace <= 0) continue;
      const rawColumn = def.slice(0, firstSpace).trim();
      const rawType = def.slice(firstSpace + 1).trim().split(/\s+/)[0] || "TEXT";
      const columnName = rawColumn.replace(/"/g, "");
      const columnType = rawType
        .replace(/SERIAL_OR_PK|DATE_TYPE|FK_INT_SPRINT/g, (match) => expandSchemaType(match, !useSqlite));
      try {
        const exists = sqlite.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).all(columnName) as any[];
        if (exists.length === 0) {
          sqlite.prepare(`ALTER TABLE "${table}" ADD COLUMN "${columnName}" ${columnType}`).run();
        }
      } catch {
      }
    }
    return;
  }

  const pool = await deps.getPostgresPool();
  const tableNames = [...new Set(tables.map((table) => table.name))];
  const placeholders = tableNames.map((_, i) => `$${i + 1}`).join(", ");
  let existingCols: Set<string>;
  try {
    const { rows } = await pool.query(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN (${placeholders})`,
      tableNames,
    );
    existingCols = new Set((rows as { table_name: string; column_name: string }[]).map((row) => `${row.table_name}.${row.column_name}`));
  } catch {
    existingCols = new Set();
  }

  for (const { table, def } of columnQueries) {
    if (def.startsWith("PRIMARY") || def.startsWith("FOREIGN") || def.startsWith("id ")) continue;
    const firstSpace = def.indexOf(" ");
    if (firstSpace <= 0) continue;
    const rawColumn = def.slice(0, firstSpace).trim();
    const rawType = def.slice(firstSpace + 1).trim().split(/\s+/)[0] || "TEXT";
    const columnName = rawColumn.replace(/"/g, "");
    if (existingCols.has(`${table}.${columnName}`)) continue;
    try {
      await pool.query(toPostgresQuery(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${columnName}" ${expandSchemaType(rawType, true)}`));
    } catch {
    }
  }
}

async function backfillPublicTokens(deps: DbBootstrapDeps) {
  const tablesToFill = [
    { table: "TestPlan", column: "publicToken" },
    { table: "TestSuite", column: "publicToken" },
    { table: "TestCase", column: "publicToken" },
    { table: "MeetingNote", column: "publicToken" },
  ];
  if (useSqlite) {
    const sqlite = await deps.getSqlite();
    for (const { table, column } of tablesToFill) {
      const rows = sqlite.prepare(`SELECT id FROM "${table}" WHERE COALESCE("${column}", '') = '' LIMIT 100`).all() as Array<{ id: string | number }>;
      if (rows.length === 0) continue;
      for (const row of rows) {
        sqlite.prepare(`UPDATE "${table}" SET "${column}" = ? WHERE id = ?`).run(randomBytes(16).toString("base64url"), row.id);
      }
    }
    return;
  }

  const pool = await deps.getPostgresPool();
  await Promise.all(
    tablesToFill.map(({ table, column }) =>
      pool.query(`UPDATE "${table}" SET "${column}" = md5(random()::text || id::text) WHERE COALESCE("${column}", '') = ''`),
    ),
  );
}

async function backfillSearchTokenEntityIdInt(deps: DbBootstrapDeps) {
  if (useSqlite) {
    const sqlite = await deps.getSqlite();
    sqlite.prepare(
      `UPDATE "SearchToken" SET "entityIdInt" = CAST("entityId" AS INTEGER) WHERE COALESCE("entityIdInt", 0) = 0`,
    ).run();
    return;
  }

  const pool = await deps.getPostgresPool();
  await pool.query(
    `UPDATE "SearchToken" SET "entityIdInt" = CAST("entityId" AS INTEGER) WHERE COALESCE("entityIdInt", 0) = 0`,
  );
}

async function backfillSortOrder(deps: DbBootstrapDeps) {
  const tablesToFill = ["Task", "Bug", "TestCase", "Sprint", "TestPlan", "TestSession", "TestSuite", "MeetingNote", "Deployment", "Assignee", "User"];
  if (useSqlite) {
    const sqlite = await deps.getSqlite();
    for (const table of tablesToFill) {
      const hasSortOrder = (sqlite.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).all("sortOrder") as any[]).length > 0;
      if (!hasSortOrder) continue;
      // Only backfill rows that still have default sortOrder=0
      const needsBackfill = (sqlite.prepare(`SELECT 1 FROM "${table}" WHERE "sortOrder" = 0 LIMIT 1`).all() as any[]).length > 0;
      if (!needsBackfill) continue;
      const rows = sqlite.prepare(`SELECT id FROM "${table}" WHERE "sortOrder" = 0 ORDER BY COALESCE("updatedAt", "createdAt") ASC, id ASC`).all() as Array<{ id: string | number }>;
      // Start from max existing sortOrder
      const maxRow = sqlite.prepare(`SELECT MAX("sortOrder") as m FROM "${table}"`).all() as Array<{ m: number | null }>;
      let nextOrder = Number(maxRow[0]?.m ?? 0) + 1;
      for (const row of rows) {
        sqlite.prepare(`UPDATE "${table}" SET "sortOrder" = ? WHERE id = ?`).run(nextOrder++, row.id);
      }
    }
    return;
  }

  const pool = await deps.getPostgresPool();
  const existing = await Promise.all(
    tablesToFill.map(async (table) => {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'sortOrder' LIMIT 1`,
        [table],
      );
      if (rows.length === 0) return null;
      // Check if any rows need backfill
      const { rows: needRows } = await pool.query(`SELECT 1 FROM "${table}" WHERE "sortOrder" = 0 LIMIT 1`);
      return needRows.length > 0 ? table : null;
    }),
  );
  await Promise.all(
    existing.filter(Boolean).map((table) =>
      pool.query(`WITH ranked AS (
        SELECT id, (SELECT COALESCE(MAX("sortOrder"), 0) FROM "${table}") + ROW_NUMBER() OVER (ORDER BY COALESCE("updatedAt", "createdAt") ASC, id ASC) AS rn
        FROM "${table}"
        WHERE "sortOrder" = 0
      ) UPDATE "${table}" t SET "sortOrder" = ranked.rn FROM ranked WHERE t.id = ranked.id`),
    ),
  );
}

async function ensureKanbanSortOrderColumns(deps: DbBootstrapDeps) {
  const tablesToFix = ["Task", "Bug", "TestCase", "Sprint", "TestPlan", "TestSession", "TestSuite", "MeetingNote", "Deployment", "Assignee", "User"];
  if (useSqlite) {
    const sqlite = await deps.getSqlite();
    for (const table of tablesToFix) {
      const exists = (sqlite.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).all("sortOrder") as any[]).length > 0;
      if (exists) continue;
      try {
        sqlite.prepare(`ALTER TABLE "${table}" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0`).run();
      } catch {
      }
    }
    return;
  }

  const pool = await deps.getPostgresPool();
  for (const table of tablesToFix) {
    try {
      const { rows } = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'sortOrder' LIMIT 1`,
        [table],
      );
      if (rows.length > 0) continue;
      await pool.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0`);
    } catch {
    }
  }
}

const globalBootstrap = globalThis as unknown as { __schemaBootstrapDone?: boolean; __schemaVersion?: number };

const CURRENT_MIGRATION_VERSION = 3;

async function getMigrationVersion(deps: DbBootstrapDeps): Promise<number> {
  try {
    if (useSqlite) {
      const sqlite = await deps.getSqlite();
      try {
        const rows = sqlite.prepare('SELECT "version" FROM "_migrations" ORDER BY "version" DESC LIMIT 1').all() as Array<{ version: number }>;
        return rows[0]?.version ?? 0;
      } catch {
        return 0;
      }
    }
    const pool = await deps.getPostgresPool();
    const { rows } = await pool.query('SELECT "version" FROM "_migrations" ORDER BY "version" DESC LIMIT 1');
    return (rows[0] as { version: number })?.version ?? 0;
  } catch {
    return 0;
  }
}

async function setMigrationVersion(deps: DbBootstrapDeps, version: number): Promise<void> {
  const createSql = `CREATE TABLE IF NOT EXISTS "_migrations" ("version" INTEGER NOT NULL, "appliedAt" ${useSqlite ? "TEXT" : "TIMESTAMP"} NOT NULL DEFAULT CURRENT_TIMESTAMP)`;
  const insertSql = `INSERT INTO "_migrations" ("version") VALUES (?)`;
  if (useSqlite) {
    const sqlite = await deps.getSqlite();
    sqlite.exec(createSql);
    sqlite.prepare(insertSql).run(version);
    return;
  }
  const pool = await deps.getPostgresPool();
  await pool.query(toPostgresQuery(createSql));
  await pool.query(toPostgresQuery(insertSql), [version]);
}

export async function ensureSchemaBootstrap(deps: DbBootstrapDeps) {
  if (typeof window !== "undefined") return;
  // Reset if migration version changed (new tables added)
  if (globalBootstrap.__schemaVersion !== CURRENT_MIGRATION_VERSION) {
    globalBootstrap.__schemaBootstrapDone = false;
    deps.setSchemaInitPromise(undefined);
    globalBootstrap.__schemaVersion = CURRENT_MIGRATION_VERSION;
  }
  if (!deps.getSchemaInitPromise()) {
    deps.setSchemaInitPromise((async () => {
      try {
        if (useSqlite) {
          const sqlite = await deps.getSqlite();
          // Always re-run CREATE TABLE IF NOT EXISTS for new tables
          sqlite.exec(schemaTableSql);
        } else {
          await execSchemaSql(schemaTableSql, deps);
        }

        await applyMissingColumns(deps);
        await ensureKanbanSortOrderColumns(deps);

        // Only run expensive backfills if migration version is behind
        if (!globalBootstrap.__schemaBootstrapDone) {
          const currentVersion = await getMigrationVersion(deps);
          if (currentVersion < CURRENT_MIGRATION_VERSION) {
            await backfillSearchTokenEntityIdInt(deps);
            await execSchemaSql(schemaIndexSql, deps);
            await backfillPublicTokens(deps);
            await backfillSortOrder(deps);
            await setMigrationVersion(deps, CURRENT_MIGRATION_VERSION);
          }
          globalBootstrap.__schemaBootstrapDone = true;
        }
      } catch (err) {
        deps.setSchemaInitPromise(undefined);
        if (databaseUrl || useSqlite) {
          console.error("Schema init error:", err);
        }
      }
    })());
  }
  return deps.getSchemaInitPromise();
}
