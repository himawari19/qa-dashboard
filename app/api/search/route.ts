import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const like = `%${q}%`;
  const results: { id: string; code: string; label: string; sublabel: string; href: string; type: string }[] = [];

  const tasks = await db.query(`SELECT id, title, status FROM "Task" WHERE title LIKE ? OR description LIKE ? LIMIT 5`, [like, like]) as any[];
  for (const t of tasks) results.push({ id: `task-${t.id}`, code: codeFromId("TASK", Number(t.id)), label: t.title, sublabel: t.status, href: "/tasks", type: "Task" });

  const bugs = await db.query(`SELECT id, title, status FROM "Bug" WHERE title LIKE ? OR module LIKE ? LIMIT 5`, [like, like]) as any[];
  for (const b of bugs) results.push({ id: `bug-${b.id}`, code: codeFromId("BUG", Number(b.id)), label: b.title, sublabel: b.status, href: "/bugs", type: "Bug" });

  const suites = await db.query(`SELECT id, title, "testPlanId" FROM "TestSuite" WHERE title LIKE ? OR "testPlanId" LIKE ? AND "deletedAt" IS NULL LIMIT 5`, [like, like]) as any[];
  for (const suite of suites) {
    results.push({
      id: `suite-${suite.id}`,
      code: codeFromId("SUITE", Number(suite.id)),
      label: String(suite.title ?? ""),
      sublabel: String(suite.testPlanId ?? ""),
      href: `/test-suites/execute/${suite.id}`,
      type: "Test Suite",
    });
  }

  const plans = await db.query(`SELECT id, code, title, status FROM "TestPlan" WHERE title LIKE ? OR code LIKE ? AND "deletedAt" IS NULL LIMIT 5`, [like, like]) as any[];
  for (const p of plans) {
    results.push({ id: `plan-${p.id}`, code: String(p.code || codeFromId("PLAN", Number(p.id))), label: p.title, sublabel: p.status, href: "/test-plans", type: "Test Plan" });
  }

  return NextResponse.json({ results: results.slice(0, 12) });
}
