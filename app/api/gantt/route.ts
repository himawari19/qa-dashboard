import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateModuleRecord } from "@/lib/data";
import { isAdminUser } from "@/lib/auth-core";

type TimelineType = "sprint" | "plan" | "task";
function getCompanyFilter(company: string, isAdmin: boolean) {
  return isAdmin ? { clause: "", params: [] as string[] } : { clause: ` AND "company" = ?`, params: [company] };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const requestedYear = Number(searchParams.get("year") || new Date().getFullYear());
  const yearText = String(Number.isFinite(requestedYear) ? requestedYear : new Date().getFullYear());

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const { clause: andCompany, params: cp } = getCompanyFilter(company, isAdmin);

  const [sprints, plans, tasks] = await Promise.all([
    db.query(
      `SELECT id, name, "startDate", "endDate", status, goal
       FROM "Sprint"
       WHERE COALESCE("startDate", '') != ''
         AND COALESCE("endDate", '') != ''
         AND SUBSTR("startDate", 1, 4) = ?
         ${andCompany}
       ORDER BY "startDate" ASC
       LIMIT 50`,
      [yearText, ...cp]
    ) as Promise<Array<Record<string, unknown>>>,
    db.query(
      `SELECT id, title, project, sprint, "startDate", "endDate", status, assignee
       FROM "TestPlan"
       WHERE COALESCE("startDate", '') != ''
         AND COALESCE("endDate", '') != ''
         AND "deletedAt" IS NULL
         AND SUBSTR("startDate", 1, 4) = ?
         ${andCompany}
       ORDER BY "startDate" ASC
       LIMIT 50`,
      [yearText, ...cp]
    ) as Promise<Array<Record<string, unknown>>>,
    db.query(
      `SELECT id, title, project, "dueDate" AS "startDate", "dueDate" AS "endDate", status, priority, assignee
       FROM "Task"
       WHERE COALESCE("dueDate", '') != ''
         AND "deletedAt" IS NULL
         AND SUBSTR("dueDate", 1, 4) = ?
         ${andCompany}
       ORDER BY "startDate" ASC
       LIMIT 100`,
      [yearText, ...cp]
    ) as Promise<Array<Record<string, unknown>>>,
  ]);

  return NextResponse.json({ sprints, plans, tasks });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const type = body?.type as TimelineType | undefined;
  const id = Number(body?.id);
  const startDate = String(body?.startDate ?? "").trim();
  const endDate = String(body?.endDate ?? "").trim();

  if (!type || !["sprint", "plan", "task"].includes(type)) {
    return NextResponse.json({ error: "Invalid timeline type. Must be one of: sprint, plan, task" }, { status: 400 });
  }
  if (!id || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields: type, id, startDate, endDate" }, { status: 400 });
  }
  if (startDate > endDate) {
    return NextResponse.json({ error: "Start date must be on or before end date" }, { status: 400 });
  }

  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const { clause: andCompany, params: cp } = getCompanyFilter(company, isAdmin);
  const table = type === "sprint" ? "Sprint" : type === "plan" ? "TestPlan" : "Task";

  try {
    const row = await db.get(
      `SELECT * FROM "${table}" WHERE "id" = CAST(? AS INTEGER)${andCompany} LIMIT 1`,
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
    } else if (type === "plan") {
      await updateModuleRecord("test-plans", id, {
        ...row,
        startDate,
        endDate,
      });
    } else {
      await updateModuleRecord("tasks", id, {
        ...row,
        dueDate: startDate,
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
  } catch (error) {
    console.error("Gantt PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
