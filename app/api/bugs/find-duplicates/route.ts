import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  
  if (!title || title.length < 5) {
    return NextResponse.json({ duplicates: [] });
  }

  // Simple keyword matching for demo
  const keywords = title.toLowerCase().split(/\s+/).filter(k => k.length > 3);
  if (keywords.length === 0) return NextResponse.json({ duplicates: [] });

  const query = `
    SELECT id, title, status FROM "Bug" 
    WHERE (LOWER(title) LIKE ?) 
    OR (LOWER(title) LIKE ?)
    LIMIT 3
  `;
  
  const matches = await db.query(query, [`%${keywords[0]}%`, `%${keywords[1] || keywords[0]}%`]) as any[];

  return NextResponse.json({ 
    duplicates: matches.map(m => ({
      id: m.id,
      code: codeFromId("BUG", Number(m.id)),
      title: m.title,
      status: m.status
    })) 
  });
}
