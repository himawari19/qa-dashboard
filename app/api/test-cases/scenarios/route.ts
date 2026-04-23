import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.query(
      'SELECT id, title, "testPlanId" FROM "TestSuite" WHERE "deletedAt" IS NULL ORDER BY "updatedAt" DESC LIMIT 5'
    ) as Record<string, unknown>[];
    const normalized = rows.map((row) => ({
      ...row,
      title: String(row.title ?? ""),
      testPlanId: String(row.testPlanId ?? ""),
    }));
    return NextResponse.json(JSON.parse(JSON.stringify(normalized)));
  } catch {
    return NextResponse.json([]);
  }
}
