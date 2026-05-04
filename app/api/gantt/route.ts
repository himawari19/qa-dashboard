import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateModuleRecord } from "@/lib/data";
import { isAdminUser } from "@/lib/auth-core";

type TimelineType = "sprint" | "plan";
function getCompanyFilter(company: string, isAdmin: boolean) {
  return isAdmin ? { clause: "", params: [] as string[] } : { clause: ` AND "company" = ?`, params: [company] };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const currentYear = new Date().getFullYear();
  const year = Number(searchParams.get("year") || currentYear);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const { clause: andCompany, params: cp } = getCompanyFilter(company, isAdmin);

  const [sprints, plans] = await Promise.all([
    db.query(
      `SELECT id, name, "startDate", "endDate", status, goal
       FROM "Sprint"
       WHERE "startDate" IS NOT NULL
         AND "endDate" IS NOT NULL
         AND DATE("startDate") <= DATE(?)
         AND DATE("endDate") >= DATE(?)
         ${andCompany}
       ORDER BY "startDate" ASC
       LIMIT 50`,
      [yearEnd, yearStart, ...cp]
    ) as Promise<Array<Record<string, unknown>>>,
    db.query(
      `SELECT id, title, project, sprint, "startDate", "endDate", status, assignee
       FROM "TestPlan"
       WHERE "startDate" IS NOT NULL
         AND "endDate" IS NOT NULL
         AND "deletedAt" IS NULL
         AND DATE("startDate") <= DATE(?)
         AND DATE("endDate") >= DATE(?)
         ${andCompany}
       ORDER BY "startDate" ASC
       LIMIT 50`,
      [yearEnd, yearStart, ...cp]
    ) as Promise<Array<Record<string, unknown>>>,
  ]);

  return NextResponse.json({ sprints, plans });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const type = body?.type as TimelineType | undefined;
  const id = Number(body?.id);
  const startDate = String(body?.startDate ?? "").trim();
  const endDate = String(body?.endDate ?? "").trim();

  if (!type || !["sprint", "plan"].includes(type)) {
    return NextResponse.json({ error: "Invalid timeline type" }, { status: 400 });
  }
  if (!id || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing timeline data" }, { status: 400 });
  }

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const { clause: andCompany, params: cp } = getCompanyFilter(company, isAdmin);
  const table = type === "sprint" ? "Sprint" : "TestPlan";

  const row = await db.get(
    `SELECT * FROM "${table}" WHERE "id" = ?${andCompany} LIMIT 1`,
    [id, ...cp]
  ) as Record<string, unknown> | undefined;

  if (!row) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (type === "sprint") {
    await updateModuleRecord("sprints", id, {
      ...row,
      startDate,
      endDate,
    });
  } else {
    await updateModuleRecord("test-plans", id, {
      ...row,
      startDate,
      endDate,
    });
  }

  return NextResponse.json({
    type,
    item: {
      ...row,
      startDate,
      endDate,
    },
  });
}
