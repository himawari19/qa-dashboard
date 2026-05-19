import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * One-time migration: fix "UNDEFINED" / "undefined" string values in the database.
 * Only accessible by superadmin/admin.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fixes: string[] = [];

  // Fix Deployment table
  const deploymentFields = ["environment", "developer", "project", "status"];
  for (const field of deploymentFields) {
    const result = await db.run(
      `UPDATE "Deployment" SET "${field}" = '' WHERE "${field}" IN ('undefined', 'UNDEFINED', 'null', 'NULL')`,
    );
    if (result.changes && result.changes > 0) {
      fixes.push(`Deployment.${field}: ${result.changes} rows fixed`);
    }
  }

  // Fix Task table
  const taskFields = ["project", "relatedFeature", "category", "status", "priority", "assignee", "dueDate"];
  for (const field of taskFields) {
    const result = await db.run(
      `UPDATE "Task" SET "${field}" = '' WHERE "${field}" IN ('undefined', 'UNDEFINED', 'null', 'NULL') AND "deletedAt" IS NULL`,
    );
    if (result.changes && result.changes > 0) {
      fixes.push(`Task.${field}: ${result.changes} rows fixed`);
    }
  }

  // Fix Bug table
  const bugFields = ["project", "module", "bugType", "severity", "priority", "status", "suggestedDev"];
  for (const field of bugFields) {
    const result = await db.run(
      `UPDATE "Bug" SET "${field}" = '' WHERE "${field}" IN ('undefined', 'UNDEFINED', 'null', 'NULL') AND "deletedAt" IS NULL`,
    );
    if (result.changes && result.changes > 0) {
      fixes.push(`Bug.${field}: ${result.changes} rows fixed`);
    }
  }

  // Fix TestCase table
  const testCaseFields = ["testSuiteId", "typeCase", "status", "priority", "assignee"];
  for (const field of testCaseFields) {
    const result = await db.run(
      `UPDATE "TestCase" SET "${field}" = '' WHERE "${field}" IN ('undefined', 'UNDEFINED', 'null', 'NULL') AND "deletedAt" IS NULL`,
    );
    if (result.changes && result.changes > 0) {
      fixes.push(`TestCase.${field}: ${result.changes} rows fixed`);
    }
  }

  // Fix TestSession table
  const sessionFields = ["project", "sprint", "tester", "result"];
  for (const field of sessionFields) {
    const result = await db.run(
      `UPDATE "TestSession" SET "${field}" = '' WHERE "${field}" IN ('undefined', 'UNDEFINED', 'null', 'NULL') AND "deletedAt" IS NULL`,
    );
    if (result.changes && result.changes > 0) {
      fixes.push(`TestSession.${field}: ${result.changes} rows fixed`);
    }
  }

  // Fix TestPlan table
  const planFields = ["project", "sprint", "status", "assignee"];
  for (const field of planFields) {
    const result = await db.run(
      `UPDATE "TestPlan" SET "${field}" = '' WHERE "${field}" IN ('undefined', 'UNDEFINED', 'null', 'NULL') AND "deletedAt" IS NULL`,
    );
    if (result.changes && result.changes > 0) {
      fixes.push(`TestPlan.${field}: ${result.changes} rows fixed`);
    }
  }

  // Fix TestSuite table
  const suiteFields = ["testPlanId", "status", "assignee"];
  for (const field of suiteFields) {
    const result = await db.run(
      `UPDATE "TestSuite" SET "${field}" = '' WHERE "${field}" IN ('undefined', 'UNDEFINED', 'null', 'NULL') AND "deletedAt" IS NULL`,
    );
    if (result.changes && result.changes > 0) {
      fixes.push(`TestSuite.${field}: ${result.changes} rows fixed`);
    }
  }

  return NextResponse.json({
    message: fixes.length > 0 ? `Fixed ${fixes.length} field(s)` : "No bad data found.",
    fixes,
  });
}
