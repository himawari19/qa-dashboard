import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth-core";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const andCompany = isAdmin ? "" : ` AND "company" = ?`;
  const cp = isAdmin ? [] : [company];

  const notifications: { id: string; type: "overdue" | "deadline"; title: string; detail: string; href: string }[] = [];

  // Bugs open for more than 7 days
  const overdueBugs = await db.query(
    `SELECT id, title, severity, "createdAt" FROM "Bug" WHERE status = 'open' AND DATE("createdAt") <= DATE('now', '-7 days')${andCompany} ORDER BY "createdAt" ASC LIMIT 10`,
    [...cp]
  ) as any[];

  for (const b of overdueBugs) {
    const days = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / 86400000);
    notifications.push({
      id: `bug-${b.id}`,
      type: "overdue",
      title: b.title,
      detail: `Bug open for ${days} days · ${b.severity}`,
      href: "/bugs",
    });
  }

  // Sprints ending within 3 days
  const deadlineSprints = await db.query(
    `SELECT id, name, "endDate" FROM "Sprint"
     WHERE status != 'completed'
       AND status != 'closed'
       AND COALESCE("endDate", '') != ''
       AND "endDate" >= DATE('now')
       AND "endDate" <= DATE('now', '+3 days')
       ${andCompany}
     ORDER BY "endDate" ASC LIMIT 5`,
    [...cp]
  ) as any[];

  for (const s of deadlineSprints) {
    const daysLeft = Math.ceil((new Date(s.endDate).getTime() - Date.now()) / 86400000);
    notifications.push({
      id: `sprint-${s.id}`,
      type: "deadline",
      title: s.name,
      detail: daysLeft === 0 ? "Sprint ends today!" : `Ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      href: "/sprints",
    });
  }

  // Test plans with approaching end date (within 2 days)
  const deadlinePlans = await db.query(
    `SELECT id, title, "endDate" FROM "TestPlan"
     WHERE status != 'closed'
       AND status != 'completed'
       AND "deletedAt" IS NULL
       AND COALESCE("endDate", '') != ''
       AND "endDate" >= DATE('now')
       AND "endDate" <= DATE('now', '+2 days')
       ${andCompany}
     ORDER BY "endDate" ASC LIMIT 5`,
    [...cp]
  ) as any[];

  for (const p of deadlinePlans) {
    const daysLeft = Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000);
    notifications.push({
      id: `plan-${p.id}`,
      type: "deadline",
      title: p.title,
      detail: daysLeft === 0 ? "Test plan ends today!" : `Ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      href: "/test-plans",
    });
  }

  return NextResponse.json({ notifications: notifications.slice(0, 15) });
}
