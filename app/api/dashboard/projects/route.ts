import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth-core";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ projects: [] }, { status: 401 });

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const andCompany = isAdmin ? "" : ` AND "company" = ?`;
  const cp = isAdmin ? [] : [company];

  const rows = await db.query(
    `SELECT DISTINCT project FROM "TestPlan" WHERE project != '' AND "deletedAt" IS NULL${andCompany}
     UNION
     SELECT DISTINCT project FROM "Bug" WHERE project != ''${andCompany}
     UNION
     SELECT DISTINCT project FROM "Task" WHERE project != ''${andCompany}
     ORDER BY project ASC`,
    [...cp, ...cp, ...cp]
  ) as any[];

  return NextResponse.json({ projects: rows.map((r: any) => String(r.project)) });
}
