import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAccessScope, logActivity } from "@/lib/data-helpers";

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, type, startDate, endDate } = await request.json();
  if (!id || !type || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { company, isAdmin } = getAccessScope(user);
  const tableName = type === "sprint" ? "Sprint" : "TestPlan";
  const companyFilter = isAdmin ? "" : ` AND "company" = ?`;
  const params = isAdmin ? [startDate, endDate, id] : [startDate, endDate, id, company];

  try {
    await db.run(`
      UPDATE "${tableName}"
      SET "startDate" = ?, "endDate" = ?, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ? ${companyFilter}
    `, params);


    await logActivity(
      company,
      type === "sprint" ? "sprint" : "test-plan",
      String(id),
      "update",
      `Adjusted timeline to ${startDate} - ${endDate}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gantt update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
