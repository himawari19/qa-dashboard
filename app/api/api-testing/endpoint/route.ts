import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.query('SELECT * FROM "ApiEndpoint" ORDER BY "updatedAt" DESC');
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch endpoints." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }
    await db.run(`DELETE FROM "ApiEndpoint" WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete endpoint." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const method = String(body.method || "GET").trim().toUpperCase();
    const endpoint = String(body.endpoint || "").trim();
    const payload = String(body.payload || "");
    const response = String(body.response || "");
    const notes = String(body.notes || "");

    if (!title || !endpoint) {
      return NextResponse.json({ error: "Title and endpoint are required." }, { status: 400 });
    }

    const result = await db.run(
      `INSERT INTO "ApiEndpoint" (title, method, endpoint, payload, response, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, method, endpoint, payload, response, notes],
    );

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to save API endpoint." }, { status: 500 });
  }
}
