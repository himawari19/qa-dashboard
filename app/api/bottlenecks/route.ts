import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth-core";
import { codeFromId } from "@/lib/utils";

// Items stuck in a status for too long
const THRESHOLDS: Record<string, number> = {
  ready_to_retest: 3,  // 3 days
  in_progress: 7,      // 7 days
  doing: 7,
  open: 10,            // 10 days
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const andCompany = isAdmin ? "" : ` AND "company" = ?`;
  const cp = isAdmin ? [] : [company];

  const bottlenecks: { id: string; code: string; title: string; module: string; status: string; days: number; href: string }[] = [];

  // Bugs
  for (const [status, threshold] of Object.entries(THRESHOLDS)) {
    const rows = await db.query(
      `SELECT id, title, status FROM "Bug" WHERE status = ? AND DATE(updatedAt) <= DATE('now', '-${threshold} days')${andCompany} LIMIT 5`,
      [status, ...cp]
    ) as any[];
    for (const r of rows) {
      const days = await db.get(
        `SELECT CAST(julianday('now') - julianday(updatedAt) AS INTEGER) as d FROM "Bug" WHERE id = ?`,
        [r.id]
      ) as any;
      bottlenecks.push({ id: `bug-${r.id}`, code: codeFromId("BUG", Number(r.id)), title: r.title, module: "Bug", status: r.status, days: Number(days?.d ?? threshold), href: "/bugs" });
    }
  }

  // Tasks
  for (const [status, threshold] of Object.entries(THRESHOLDS)) {
    const rows = await db.query(
      `SELECT id, title, status FROM "Task" WHERE status = ? AND DATE(updatedAt) <= DATE('now', '-${threshold} days')${andCompany} LIMIT 5`,
      [status, ...cp]
    ) as any[];
    for (const r of rows) {
      const days = await db.get(
        `SELECT CAST(julianday('now') - julianday(updatedAt) AS INTEGER) as d FROM "Task" WHERE id = ?`,
        [r.id]
      ) as any;
      bottlenecks.push({ id: `task-${r.id}`, code: codeFromId("TASK", Number(r.id)), title: r.title, module: "Task", status: r.status, days: Number(days?.d ?? threshold), href: "/tasks" });
    }
  }

  bottlenecks.sort((a, b) => b.days - a.days);

  return NextResponse.json({ bottlenecks: bottlenecks.slice(0, 15) });
}
