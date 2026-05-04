import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDashboardData } from "@/lib/data";
import { DashboardHome } from "@/components/dashboard-home";

export const dynamic = "force-dynamic";

async function getDashboardProjectsForUser() {
  const user = await getCurrentUser();
  if (!user) return [];

  const company = String(user.company ?? "").trim();
  const isAdmin = String(user.role ?? "").trim().toLowerCase() === "admin" && !company;
  const andCompany = isAdmin ? "" : ` AND "company" = ?`;
  const cp = isAdmin ? [] : [company];

  const rows = await db.query(
    `SELECT DISTINCT project FROM "TestPlan" WHERE project != '' AND "deletedAt" IS NULL${andCompany}
     UNION
     SELECT DISTINCT project FROM "Bug" WHERE project != ''${andCompany}
     UNION
     SELECT DISTINCT project FROM "Task" WHERE project != ''${andCompany}
     ORDER BY project ASC`,
    [...cp, ...cp, ...cp],
  ) as any[];

  return rows.map((r: any) => String(r.project));
}

export default async function Home() {
  const [data, projects] = await Promise.all([
    getDashboardData(),
    getDashboardProjectsForUser(),
  ]);

  return <DashboardHome initialData={data} initialProjects={projects} />;
}
