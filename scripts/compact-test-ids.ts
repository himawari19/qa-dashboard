import { db } from "../lib/db";

type Row = Record<string, string | number | null>;

async function main() {
  const plans = await db.query<Row>('SELECT id FROM "TestPlan" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC, id ASC');
  const suites = await db.query<Row>('SELECT id, "testPlanId" FROM "TestSuite" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC, id ASC');
  const cases = await db.query<Row>('SELECT id, "testSuiteId" FROM "TestCase" WHERE "deletedAt" IS NULL ORDER BY "createdAt" ASC, id ASC');

  await db.run("BEGIN TRANSACTION");
  try {
    const planMap = new Map<string, number>();
    plans.forEach((row, index) => {
      planMap.set(String(row.id), index + 1);
    });

    const suiteMap = new Map<string, number>();
    suites.forEach((row, index) => {
      suiteMap.set(String(row.id), index + 1);
    });

    const planTempMap = new Map<string, number>();
    const suiteTempMap = new Map<string, number>();

    plans.forEach((row, index) => planTempMap.set(String(row.id), -(index + 1)));
    suites.forEach((row, index) => suiteTempMap.set(String(row.id), -(index + 1)));

    for (const row of plans) {
      const oldId = String(row.id);
      const tempId = planTempMap.get(oldId);
      if (tempId && Number(oldId) !== tempId) {
        await db.run('UPDATE "TestPlan" SET id = ? WHERE id = ?', [tempId, oldId]);
      }
    }

    for (const row of suites) {
      const oldId = String(row.id);
      const tempId = suiteTempMap.get(oldId);
      if (!tempId || Number(oldId) === tempId) continue;
      const oldPlanId = String(row.testPlanId ?? "");
      const mappedPlanTempId = planTempMap.get(oldPlanId);
      await db.run(
        'UPDATE "TestSuite" SET id = ?, "testPlanId" = ? WHERE id = ?',
        [tempId, mappedPlanTempId ? String(mappedPlanTempId) : oldPlanId, oldId],
      );
    }

    for (const row of cases) {
      const oldSuiteId = String(row.testSuiteId ?? "");
      const mappedSuiteTempId = suiteTempMap.get(oldSuiteId);
      if (mappedSuiteTempId) {
        await db.run(
          'UPDATE "TestCase" SET "testSuiteId" = ? WHERE id = ?',
          [String(mappedSuiteTempId), row.id],
        );
      }
    }

    for (const row of plans) {
      const oldId = String(row.id);
      const finalId = planMap.get(oldId);
      const tempId = planTempMap.get(oldId);
      if (finalId && tempId !== undefined && tempId !== finalId) {
        await db.run('UPDATE "TestPlan" SET id = ? WHERE id = ?', [finalId, tempId]);
      }
    }

    for (const row of suites) {
      const oldId = String(row.id);
      const finalId = suiteMap.get(oldId);
      const tempId = suiteTempMap.get(oldId);
      if (!finalId || tempId === undefined) continue;
      const mappedPlanId = planMap.get(String(row.testPlanId ?? ""));
      await db.run(
        'UPDATE "TestSuite" SET id = ?, "testPlanId" = ? WHERE id = ?',
        [finalId, mappedPlanId ? String(mappedPlanId) : String(row.testPlanId ?? ""), tempId],
      );
    }

    for (const row of cases) {
      const oldSuiteId = String(row.testSuiteId ?? "");
      const mappedSuiteId = suiteMap.get(oldSuiteId);
      if (mappedSuiteId) {
        await db.run(
          'UPDATE "TestCase" SET "testSuiteId" = ? WHERE id = ?',
          [String(mappedSuiteId), row.id],
        );
      }
    }

    await db.run("COMMIT");
    console.log("Compaction complete.");
  } catch (error) {
    await db.run("ROLLBACK");
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
