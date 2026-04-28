import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [plans, suites] = await Promise.all([
      db.query<{
        id: number;
        title: string;
        project: string;
        status: string;
        startDate: string;
        endDate: string;
        assignee: string;
        sprint: string;
        scope: string;
        notes: string;
      }>(
        `SELECT id, title, project, status, startDate, endDate, COALESCE(assignee, '') as assignee, sprint, scope, COALESCE(notes, '') as notes FROM "TestPlan" WHERE deletedAt IS NULL AND startDate IS NOT NULL`
      ),
      db.query<{
        id: number;
        testPlanId: string;
        title: string;
        assignee: string;
        status: string;
      }>(
        `SELECT id, testPlanId, title, COALESCE(assignee, '') as assignee, status FROM "TestSuite" WHERE deletedAt IS NULL`
      )
    ]);

    const events = plans.map(p => {
      const planSuites = suites.filter(s => String(s.testPlanId) === String(p.id));
      
      // Inherit assignees from suites if plan assignee is empty
      let displayAssignee = p.assignee;
      if (!displayAssignee || displayAssignee.trim() === '') {
        const suiteAssignees = Array.from(new Set(planSuites.map(s => s.assignee).filter(a => a && a.trim() !== '')));
        if (suiteAssignees.length > 0) {
          displayAssignee = suiteAssignees.join(', ');
        }
      }

      const status = p.status.toLowerCase();
      let color = '#94a3b8'; // Draft (Slate)
      if (status === 'active') color = '#3b82f6'; // Active (Blue)
      if (status === 'closed' || status === 'completed') color = '#10b981'; // Closed (Emerald)
      
      return {
        id: `plan-${p.id}`,
        title: p.title,
        start: p.startDate,
        end: p.endDate || p.startDate,
        type: 'plan',
        project: p.project,
        status: p.status,
        assignee: displayAssignee,
        sprint: p.sprint,
        scope: p.scope,
        notes: p.notes,
        suites: planSuites.map(s => ({
          id: s.id,
          title: s.title,
          assignee: s.assignee,
          status: s.status
        })),
        color
      };
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Calendar API Error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}
