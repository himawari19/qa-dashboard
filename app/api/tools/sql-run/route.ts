import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "Admin (Owner)") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  try {
    const { query, params } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const normalizedQuery = query.trim().toUpperCase();
    if (!normalizedQuery.startsWith("SELECT")) {
      return NextResponse.json({ error: "Only SELECT queries are allowed" }, { status: 400 });
    }

    const result = await db.query(query, params || []);
    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
