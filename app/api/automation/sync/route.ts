import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results } = body;

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Invalid results format." }, { status: 400 });
    }

    let updatedCount = 0;
    for (const res of results) {
      if (res.tcId && res.status) {
        await db.run(
          `UPDATE "TestCase" 
           SET "automationResult" = ?, "lastRunAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
           WHERE "tcId" = ?`,
          [res.status, res.tcId]
        );
        updatedCount++; // SQLite doesn't return changes easily without more overhead, but we can assume success if no error
      }
    }

    revalidatePath("/test-case-management");
    revalidatePath("/reports");

    return NextResponse.json({
      message: `Automation sync completed. Updated ${updatedCount} test cases.`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
