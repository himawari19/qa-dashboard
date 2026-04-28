import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const company = user.company || "";
  const isAdmin = (user.role === "admin" || user.role === "Admin (Owner)") && !company;
  const andCompany = isAdmin ? "" : ` AND "company" = ?`;
  const cp = isAdmin ? [] : [company];

  const like = `%${q}%`;
  const results: { id: string; code: string; label: string; sublabel: string; href: string; type: string }[] = [];

  const tasks = await db.query(`SELECT id, title, status FROM "Task" WHERE (title LIKE ? OR description LIKE ?)${andCompany} LIMIT 5`, [like, like, ...cp]) as any[];
  for (const t of tasks) results.push({ id: `task-${t.id}`, code: codeFromId("TASK", Number(t.id)), label: t.title, sublabel: t.status, href: "/tasks", type: "Task" });

  const bugs = await db.query(`SELECT id, title, status FROM "Bug" WHERE (title LIKE ? OR module LIKE ?)${andCompany} LIMIT 5`, [like, like, ...cp]) as any[];
  for (const b of bugs) results.push({ id: `bug-${b.id}`, code: codeFromId("BUG", Number(b.id)), label: b.title, sublabel: b.status, href: "/bugs", type: "Bug" });

  const suites = await db.query(`SELECT id, title, "testPlanId", "publicToken" FROM "TestSuite" WHERE (title LIKE ? OR "testPlanId" LIKE ?) AND "deletedAt" IS NULL${andCompany} LIMIT 5`, [like, like, ...cp]) as any[];
  for (const suite of suites) {
    results.push({
      id: `suite-${suite.id}`,
      code: codeFromId("SUITE", Number(suite.id)),
      label: String(suite.title ?? ""),
      sublabel: String(suite.testPlanId ?? ""),
      href: `/test-suites/execute/${suite.publicToken}`,
      type: "Test Suite",
    });
  }

  const plans = await db.query(`SELECT id, code, title, status, "publicToken" FROM "TestPlan" WHERE (title LIKE ? OR code LIKE ?) AND "deletedAt" IS NULL${andCompany} LIMIT 5`, [like, like, ...cp]) as any[];
  for (const p of plans) {
    results.push({ id: `plan-${p.id}`, code: String(p.code || codeFromId("PLAN", Number(p.id))), label: p.title, sublabel: p.status, href: `/test-plans/${p.publicToken}`, type: "Test Plan" });
  }

  return NextResponse.json({ results: results.slice(0, 12) });
}
