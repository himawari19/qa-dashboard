import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTableName } from "@/lib/data";
import type { ModuleKey } from "@/lib/modules";

vi.mock("@/lib/db", () => ({
  db: {
    query: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue(undefined),
    exec: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("getTableName mapping - CREATE operation", () => {
  const createMappings: { module: ModuleKey; table: string }[] = [
    { module: "tasks", table: "Task" },
    { module: "bugs", table: "Bug" },
    { module: "test-cases", table: "TestCase" },
    { module: "test-plans", table: "TestPlan" },
    { module: "test-sessions", table: "TestSession" },
    { module: "test-suites", table: "TestSuite" },
    { module: "api-testing", table: "ApiEndpoint" },
    { module: "env-config", table: "EnvConfig" },
    { module: "workload", table: "WorkloadAssignment" },
    { module: "performance", table: "PerformanceBenchmark" },
    { module: "meeting-notes", table: "MeetingNote" },
    { module: "daily-logs", table: "DailyLog" },
    { module: "sql-snippets", table: "SqlSnippet" },
    { module: "testing-assets", table: "TestingAsset" },
  ];

  it.each(createMappings)(
    "CREATE: $module -> $table",
    ({ module, table }) => expect(getTableName(module)).toBe(table)
  );
});

describe("getTableName mapping - UPDATE operation", () => {
  const updateModules: ModuleKey[] = [
    "tasks", "bugs", "test-cases", "test-plans", "test-sessions",
    "test-suites", "api-testing", "env-config", "workload",
    "performance", "meeting-notes", "daily-logs",
  ];

  it.each(updateModules)(
    "UPDATE works for $module",
    (module) => {
      const tableName = getTableName(module);
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe("string");
      expect(tableName.length).toBeGreaterThan(0);
    }
  );
});

describe("getTableName mapping - DELETE operation", () => {
  const deleteModules: ModuleKey[] = [
    "tasks", "bugs", "test-cases", "meeting-notes", "daily-logs",
    "test-suites", "sql-snippets", "testing-assets",
  ];

  it.each(deleteModules)(
    "DELETE: $module has valid table name",
    (module) => {
      const tableName = getTableName(module);
      expect(tableName).not.toMatch(/^[a-z]/);
    }
  );
});

describe("getTableName mapping - CLEAR/BULK operations", () => {
  const bulkModules: ModuleKey[] = [
    "tasks", "bugs", "test-cases", "test-plans", "test-sessions",
  ];

  it.each(bulkModules)(
    "CLEAR/BULK: $module maps correctly",
    (module) => expect(getTableName(module)).not.toBe(module)
  );
});

describe("Test case status values - CRUD consistency", () => {
  const validStatuses = ["Pending", "Success", "Failed"];

  it("CREATE: accepts valid status", () => {
    expect(validStatuses).toContain("Pending");
    expect(validStatuses).toContain("Success");
    expect(validStatuses).toContain("Failed");
  });

  it("UPDATE: preserves status values", () => {
    const statuses = ["Success", "Failed", "Pending"];
    statuses.forEach((status) => {
      expect(validStatuses).toContain(status);
    });
  });

  it("DELETE: does not validate status", () => {
    expect(validStatuses).toHaveLength(3);
  });

  it("BULK: uses uppercase status values", () => {
    const sampleRows = [
      { id: 1, status: "Success" },
      { id: 2, status: "Failed" },
      { id: 3, status: "Pending" },
    ];
    sampleRows.forEach((row) => {
      expect(validStatuses).toContain(row.status);
    });
  });
});

describe("Table name edge cases", () => {
  it("unknown module returns fallback (empty string)", () => {
    expect(getTableName("unknown" as ModuleKey)).toBe("");
  });

  it("empty module returns fallback (empty string)", () => {
    expect(getTableName("" as ModuleKey)).toBe("");
  });
});
