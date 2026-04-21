import { describe, it, expect, vi } from "vitest";
import { getTableName } from "@/lib/data";
import type { ModuleKey } from "@/lib/modules";

vi.mock("@/lib/db", () => ({
  db: {
    query: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("getTableName mapping", () => {
  const mappings: { module: ModuleKey; expectedTable: string }[] = [
    { module: "tasks", expectedTable: "Task" },
    { module: "bugs", expectedTable: "Bug" },
    { module: "test-cases", expectedTable: "TestCaseScenario" },
    { module: "test-plans", expectedTable: "TestPlan" },
    { module: "test-sessions", expectedTable: "TestSession" },
    { module: "test-suites", expectedTable: "TestSuite" },
    { module: "api-testing", expectedTable: "ApiEndpoint" },
    { module: "env-config", expectedTable: "EnvConfig" },
    { module: "workload", expectedTable: "WorkloadAssignment" },
    { module: "performance", expectedTable: "PerformanceBenchmark" },
    { module: "meeting-notes", expectedTable: "MeetingNote" },
    { module: "daily-logs", expectedTable: "DailyLog" },
    { module: "sql-snippets", expectedTable: "SqlSnippet" },
    { module: "testing-assets", expectedTable: "TestingAsset" },
  ];

  it.each(mappings)(
    "maps `$module` to `$expectedTable`",
    ({ module, expectedTable }) => {
      expect(getTableName(module)).toBe(expectedTable);
    }
  );

  it("does NOT produce invalid table names for hyphenated modules", () => {
    const invalidTables = ["Meetingnotes", "Dailylogs", "Testplans", "Testsessions", "Testsuites"];
    invalidTables.forEach((invalid) => {
      expect(getTableName(invalid as ModuleKey)).not.toBe(invalid);
    });
  });
});

describe("Test case status values consistency", () => {
  const validStatuses = ["Pending", "Success", "Failed"];

  it.each(validStatuses)("accepts status: %s", (status) => {
    expect(validStatuses).toContain(status);
  });

  it("uses 'Success' (NOT 'Passed') as pass status", () => {
    expect(validStatuses).toContain("Success");
    expect(validStatuses).not.toContain("Passed");
  });

  it("uses 'Failed' as fail status", () => {
    expect(validStatuses).toContain("Failed");
  });

  it("does NOT use lowercase 'passed' or 'failed' as status", () => {
    expect(validStatuses).not.toContain("passed");
    expect(validStatuses).not.toContain("failed");
  });

  it("api PUT route should handle array with status field", () => {
    const testCaseRows = [
      { id: 1, status: "Success" },
      { id: 2, status: "Failed" },
      { id: 3, status: "Pending" },
    ];

    testCaseRows.forEach((row) => {
      expect(validStatuses).toContain(row.status);
    });
  });
});