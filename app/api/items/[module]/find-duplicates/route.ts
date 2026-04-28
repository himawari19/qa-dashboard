import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { moduleConfigs, type ModuleKey } from "@/lib/modules";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  const { module: moduleParam } = await params;
  const module = moduleParam as ModuleKey;
  const title = request.nextUrl.searchParams.get("title");
  
  if (!title || title.length < 5) {
    return NextResponse.json({ duplicates: [] });
  }

  const config = moduleConfigs[module];
  if (!config) return NextResponse.json({ duplicates: [] });

  // Map module to table name
  const tableMap: Record<string, string> = {
    "bugs": "Bug",
    "tasks": "Task",
    "test-plans": "TestPlan",
    "test-suites": "TestSuite",
    "test-cases": "TestCase",
    "meeting-notes": "MeetingNote"
  };

  const tableName = tableMap[module];
  if (!tableName) return NextResponse.json({ duplicates: [] });

  // Find the 'title' equivalent field (some use 'caseName' or 'title')
  const titleField = config.fields.find(f => f.name === "title" || f.name === "caseName")?.name || "title";

  const keywords = title.toLowerCase().split(/\s+/).filter((k) => k.length > 2);
  if (keywords.length === 0) return NextResponse.json({ duplicates: [] });

  // Simple keyword matching
  const query = `
    SELECT id, ${titleField} as title, status, updatedAt FROM "${tableName}" 
    WHERE LOWER(${titleField}) LIKE ? OR LOWER(${titleField}) LIKE ?
    ORDER BY updatedAt DESC
    LIMIT 3
  `;
  
  try {
    const matches = await db.query<{ id: number; title: string; status: string; updatedAt: string }>(
      query,
      [`%${keywords[0]}%`, `%${keywords[1] || keywords[0]}%`],
    );

    const prefixMap: Record<string, string> = {
        "bugs": "BUG",
        "tasks": "TASK",
        "test-plans": "PLAN",
        "test-suites": "SUITE",
        "test-cases": "TC",
        "meeting-notes": "MTG"
    };

    return NextResponse.json({ 
      duplicates: matches.map(m => ({
        id: m.id,
        code: codeFromId(prefixMap[module] || "ITEM", Number(m.id)),
        title: m.title,
        status: m.status,
      })) 
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ duplicates: [] });
  }
}
