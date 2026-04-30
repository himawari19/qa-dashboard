import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/lib/db";

// One-shot prod DB reset. Delete this file after use.
// Call with: POST /api/tools/reset-db  { "secret": "<RESET_SECRET env var>" }
export async function POST(request: NextRequest) {
  const secret = process.env.RESET_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RESET_SECRET env var not set" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.secret !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  try {
    const tableNames = tables.map((t) => `"${t.name}"`);
    // Postgres (Neon prod)
    await db.exec(`TRUNCATE ${tableNames.join(", ")} RESTART IDENTITY CASCADE;`);
    return NextResponse.json({ ok: true, message: "All tables truncated. Delete this endpoint now." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
