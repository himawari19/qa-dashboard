import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title") || "";
  if (title.length < 3) return NextResponse.json({ duplicates: [] });

  try {
    const rows = await db.query(
      `SELECT id, title, status, priority FROM "Task" WHERE LOWER(title) LIKE ? LIMIT 5`,
      [`%${title.toLowerCase()}%`]
    ) as Record<string, unknown>[];
    const plain = JSON.parse(JSON.stringify(rows));
    return NextResponse.json({ duplicates: plain });
  } catch {
    return NextResponse.json({ duplicates: [] });
  }
}
