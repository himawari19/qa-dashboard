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

  const tables: Array<{ table: string; fields: string[] }> = [
    { table: "Deployment", fields: ["environment", "developer", "project", "status"] },
    { table: "Task", fields: ["project", "relatedFeature", "category", "status", "priority", "assignee", "dueDate"] },
    { table: "Bug", fields: ["project", "module", "bugType", "severity", "priority", "status", "suggestedDev"] },
    { table: "TestCase", fields: ["testSuiteId", "typeCase", "status", "priority", "assignee"] },
    { table: "TestSession", fields: ["project", "sprint", "tester", "result"] },
    { table: "TestPlan", fields: ["project", "sprint", "status", "assignee"] },
    { table: "TestSuite", fields: ["testPlanId", "status", "assignee"] },
    { table: "Sprint", fields: ["status"] },
    { table: "MeetingNote", fields: ["project"] },
  ];

  for (const { table, fields } of tables) {
    for (const field of fields) {
      try {
        await db.run(
          `UPDATE "${table}" SET "${field}" = '' WHERE "${field}" IN ('undefined', 'UNDEFINED', 'null', 'NULL')`,
        );
        fixes.push(`${table}.${field}`);
      } catch {
        // Skip if table/field doesn't exist
      }
    }
  }

  return NextResponse.json({
    message: `Cleanup complete. Checked ${fixes.length} field(s) across all tables.`,
    fieldsChecked: fixes,
  });
}
