import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { ids, status } = await request.json();
    
    if (!Array.isArray(ids) || !status) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const query = `UPDATE "TestCase" SET "status" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" IN (${ids.map(() => "?").join(",")})`;
    
    await db.run(query, [status, ...ids]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
