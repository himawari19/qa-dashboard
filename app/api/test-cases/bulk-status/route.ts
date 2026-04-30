import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth-core";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);

  try {
    const { ids, status } = await request.json();

    if (!Array.isArray(ids) || !status) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const companyFilter = isAdmin ? "" : ' AND "company" = ?';
    const query = `UPDATE "TestCase" SET "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" IN (${ids.map(() => "?").join(",")})${companyFilter}`;
    const params = isAdmin ? [status, ...ids] : [status, ...ids, company];

    await db.run(query, params);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
