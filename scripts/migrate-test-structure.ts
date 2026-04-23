import { db } from "../lib/db";

async function columnExists(table: string, column: string) {
  try {
    const rows = await db.query<Record<string, unknown>>(
      `SELECT 1 AS ok FROM pragma_table_info('${table}') WHERE name = ? LIMIT 1`,
      [column],
    );
    return rows.length > 0;
  } catch {
    try {
      const rows = await db.query<Record<string, unknown>>(
        `SELECT 1 AS ok FROM information_schema.columns WHERE table_name = ? AND column_name = ? LIMIT 1`,
        [table.toLowerCase(), column.toLowerCase()],
      );
      return rows.length > 0;
    } catch {
      return false;
    }
  }
}

async function tableExists(table: string) {
  try {
    const rows = await db.query<Record<string, unknown>>(
      `SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`,
      [table],
    );
    if (rows.length > 0) return true;
  } catch {
    // ignore
  }

  try {
    const rows = await db.query<Record<string, unknown>>(
      `SELECT 1 AS ok FROM information_schema.tables WHERE table_name = ? LIMIT 1`,
      [table.toLowerCase()],
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  const hasLegacyScenario = await tableExists("TestCaseScenario");
  const hasPlan = await tableExists("TestPlan");
  const hasSuite = await tableExists("TestSuite");
  const hasCase = await tableExists("TestCase");

  if (!hasPlan || !hasSuite || !hasCase) {
    throw new Error("Target tables are missing. Run the app once to initialize schema first.");
  }

  if (hasLegacyScenario) {
    const legacy = await db.query<Record<string, unknown>>('SELECT * FROM "TestCaseScenario" ORDER BY id ASC');
    for (const row of legacy) {
      const planId = `TP-${String(row.id)}`;
      const suiteId = `TS-${String(row.id)}`;
      const existingPlan = await db.get<Record<string, unknown>>('SELECT id FROM "TestPlan" WHERE code = ? LIMIT 1', [planId]);
      if (!existingPlan) {
        await db.run(
          'INSERT INTO "TestPlan" (code, title, project, sprint, scope, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [planId, String(row.moduleName ?? row.title ?? "Legacy Plan"), String(row.projectName ?? row.project ?? ""), String(row.sprint ?? "Legacy"), String(row.referenceDocument ?? row.scope ?? ""), "active", String(row.traceability ?? "")],
        );
      }

      const existingSuite = await db.get<Record<string, unknown>>('SELECT id FROM "TestSuite" WHERE id = ? LIMIT 1', [suiteId]);
      if (!existingSuite) {
        await db.run(
          'INSERT INTO "TestSuite" (id, "testPlanId", title, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [suiteId, planId, String(row.moduleName ?? "Legacy Suite"), "active", String(row.traceability ?? "")],
        );
      }
    }
  }

  const hasScenarioId = await columnExists("TestCase", "scenarioId");
  if (hasScenarioId) {
    const cases = await db.query<Record<string, unknown>>('SELECT * FROM "TestCase" ORDER BY id ASC');
    for (const row of cases) {
      const suiteId = String((row.testSuiteId ?? row.scenarioId) ?? "");
      if (!suiteId) continue;
      await db.run(
        'UPDATE "TestCase" SET "testSuiteId" = ?, "deletedAt" = NULL WHERE id = ?',
        [suiteId, row.id],
      );
    }
  }

  console.log("Migration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
