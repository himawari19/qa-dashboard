import { tables } from "@/lib/db-schema";

const sequentialIdTables = new Set(tables.map((table) => table.name));

export type PostgresPool = {
  query: (queryText: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

export type SqliteDatabase = {
  exec: (queryText: string) => void;
  prepare: (queryText: string) => {
    all: (...params: unknown[]) => unknown[];
    run: (...params: unknown[]) => unknown;
  };
};

function normalizePostgresQuery(queryStr: string) {
  return queryStr;
}

export function toPostgresQuery(queryStr: string) {
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

export function parseInsertStatement(queryStr: string) {
  const match = queryStr.match(/^\s*INSERT(?:\s+OR\s+\w+)?\s+INTO\s+"([^"]+)"\s*\(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*?)\)([\s\S]*)$/i);
  if (!match) return null;

  const [, table, columnsRaw, valuesRaw, suffix] = match;
  const columns = columnsRaw
    .split(",")
    .map((column) => column.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
  const values = valuesRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return { table, columns, values, suffix };
}

export function buildSequentialInsert(queryStr: string, params: unknown[], nextId: number) {
  const parsed = parseInsertStatement(queryStr);
  if (!parsed) return { queryStr, params };
  if (!sequentialIdTables.has(parsed.table)) return { queryStr, params };
  if (parsed.columns.includes("id")) return { queryStr, params };

  const quotedColumns = [`"id"`].concat(parsed.columns.map((column) => `"${column}"`));
  const nextValues = ["?"].concat(parsed.values);
  const rewrittenSql = `INSERT INTO "${parsed.table}" (${quotedColumns.join(", ")}) VALUES (${nextValues.join(", ")})${parsed.suffix}`;
  return { queryStr: rewrittenSql, params: [nextId, ...params] };
}

export function isSequentialIdConflict(err: unknown, table: string) {
  if (typeof err !== "object" || err === null) return false;
  const error = err as { code?: string; message?: string; detail?: string };
  const message = String(error.message ?? "").toLowerCase();
  const detail = String(error.detail ?? "").toLowerCase();
  const tableName = table.toLowerCase();

  if (message.includes("unique constraint failed") && message.includes(`${tableName}.id`)) {
    return true;
  }
  if (detail.includes("(id)=")) {
    return true;
  }
  return false;
}
