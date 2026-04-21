import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const like = `%${q}%`;
  const results: { id: string; code: string; label: string; sublabel: string; href: string; type: string }[] = [];

  // Tasks
  const tasks = await db.query(`SELECT id, title, status FROM "Task" WHERE title LIKE ? OR description LIKE ? LIMIT 5`, [like, like]) as any[];
  for (const t of tasks) {
    results.push({ id: `task-${t.id}`, code: codeFromId("TASK", Number(t.id)), label: t.title, sublabel: t.status, href: "/tasks", type: "Task" });
  }

  // Bugs
  const bugs = await db.query(`SELECT id, title, status FROM "Bug" WHERE title LIKE ? OR module LIKE ? LIMIT 5`, [like, like]) as any[];
  for (const b of bugs) {
    results.push({ id: `bug-${b.id}`, code: codeFromId("BUG", Number(b.id)), label: b.title, sublabel: b.status, href: "/bugs", type: "Bug" });
  }

  // Test Case Scenarios
  const tcs = await db.query(`SELECT id, "moduleName", "projectName" FROM "TestCaseScenario" WHERE "moduleName" LIKE ? OR "projectName" LIKE ? LIMIT 5`, [like, like]) as any[];
  for (const tc of tcs) {
    results.push({ id: `tc-${tc.id}`, code: `TC`, label: tc.moduleName, sublabel: tc.projectName, href: `/test-case-management/${tc.id}`, type: "Test Case" });
  }

  // Meeting Notes
  const meetings = await db.query(`SELECT id, title, project FROM "MeetingNote" WHERE title LIKE ? OR project LIKE ? LIMIT 3`, [like, like]) as any[];
  for (const m of meetings) {
    results.push({ id: `mtg-${m.id}`, code: codeFromId("MTG", Number(m.id)), label: m.title, sublabel: m.project, href: "/meeting-notes", type: "Meeting" });
  }

  // API Endpoints
  const apis = await db.query(`SELECT id, title, endpoint FROM "ApiEndpoint" WHERE title LIKE ? OR endpoint LIKE ? LIMIT 3`, [like, like]) as any[];
  for (const a of apis) {
    results.push({ id: `api-${a.id}`, code: codeFromId("API", Number(a.id)), label: a.title, sublabel: a.endpoint, href: "/api-testing", type: "API" });
  }

  // Daily Logs
  const logs = await db.query(`SELECT id, project, "whatTested" FROM "DailyLog" WHERE project LIKE ? OR "whatTested" LIKE ? LIMIT 3`, [like, like]) as any[];
  for (const l of logs) {
    results.push({ id: `log-${l.id}`, code: codeFromId("LOG", Number(l.id)), label: l.project, sublabel: l.whatTested?.substring(0, 60) + "...", href: "/daily-logs", type: "Daily Log" });
  }

  return NextResponse.json({ results: results.slice(0, 12) });
}
