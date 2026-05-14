import { describe, expect, it } from "vitest";
import {
  buildSequentialInsert,
  isSequentialIdConflict,
  parseInsertStatement,
  toPostgresQuery,
} from "@/lib/db-query-utils";

describe("db-query-utils", () => {
  it("converts sqlite-style DATE and params to postgres syntax", () => {
    const sql = `SELECT * FROM "Task" WHERE DATE('now', '-7 days') <= DATE("updatedAt") AND "company" = ?`;

    expect(toPostgresQuery(sql)).toBe(
      `SELECT * FROM "Task" WHERE CURRENT_DATE - INTERVAL '7 days' <= ("updatedAt")::date AND "company" = $1`,
    );
  });

  it("parses quoted insert statements", () => {
    expect(
      parseInsertStatement(
        'INSERT INTO "Task" ("company", "title", "status") VALUES (?, ?, ?) RETURNING "id"',
      ),
    ).toEqual({
      table: "Task",
      columns: ["company", "title", "status"],
      values: ["?", "?", "?"],
      suffix: ' RETURNING "id"',
    });
  });

  it("prepends id for sequential insert tables", () => {
    expect(
      buildSequentialInsert(
        'INSERT INTO "Task" ("company", "title") VALUES (?, ?)',
        ["acme", "Task A"],
        17,
      ),
    ).toEqual({
      queryStr: 'INSERT INTO "Task" ("id", "company", "title") VALUES (?, ?, ?)',
      params: [17, "acme", "Task A"],
    });
  });

  it("does not rewrite inserts that already include id", () => {
    const input = 'INSERT INTO "Task" ("id", "company", "title") VALUES (?, ?, ?)';
    const params = [10, "acme", "Task A"];

    expect(buildSequentialInsert(input, params, 17)).toEqual({
      queryStr: input,
      params,
    });
  });

  it("detects sequential id conflicts for sqlite and postgres errors", () => {
    expect(
      isSequentialIdConflict({ message: 'UNIQUE constraint failed: task.id' }, "Task"),
    ).toBe(true);
    expect(
      isSequentialIdConflict({ detail: "Key (id)=(5) already exists." }, "Task"),
    ).toBe(true);
    expect(
      isSequentialIdConflict({ message: "duplicate key on title" }, "Task"),
    ).toBe(false);
  });
});
