import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.query(
      'SELECT id, moduleName, projectName FROM "TestCaseScenario" ORDER BY "updatedAt" DESC LIMIT 5'
    ) as Record<string, unknown>[];
    return NextResponse.json(JSON.parse(JSON.stringify(rows)));
  } catch {
    return NextResponse.json([]);
  }
}
