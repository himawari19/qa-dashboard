import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth-core";

const projectCache = new Map<string, { expiresAt: number; data: string[] }>();

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ projects: [] }, { status: 401 });

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const cacheKey = `${company}|${isAdmin ? "admin" : "user"}`;
  const cached = projectCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ projects: cached.data });
  }
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

  const projects = rows.map((r: any) => String(r.project));
  projectCache.set(cacheKey, { data: projects, expiresAt: Date.now() + 60000 });
  return NextResponse.json({ projects });
}
