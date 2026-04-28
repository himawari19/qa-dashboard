import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // 1. Get all active items with their assignees, severities, projects, and due dates
    const bugs = await db.query<{ assignee: string; severity: string; project: string; dueDate: string }>(
      `SELECT suggestedDev as assignee, severity, project, NULL as dueDate FROM "Bug" WHERE status NOT IN ('fixed', 'closed', 'rejected') AND suggestedDev IS NOT NULL AND suggestedDev != ''`
    );
    
    const tasks = await db.query<{ assignee: string; severity: string; project: string; dueDate: string }>(
      `SELECT assignee, priority as severity, project, dueDate FROM "Task" WHERE status NOT IN ('completed', 'done') AND assignee IS NOT NULL AND assignee != ''`
    );

    const allItems = [...bugs, ...tasks];
    const userStats: Record<string, { points: number; projects: Set<string>; items: number }> = {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrow = today + (24 * 60 * 60 * 1000);

    allItems.forEach(item => {
      if (!userStats[item.assignee]) {
        userStats[item.assignee] = { points: 0, projects: new Set(), items: 0 };
      }
      
      const stats = userStats[item.assignee];
      stats.projects.add(item.project);
      stats.items += 1;

      // Base Points
      let basePoints = 4; // default
      const sev = (item.severity || "").toLowerCase();
      if (sev === "critical" || sev === "blocker") basePoints = 10;
      else if (sev === "high") basePoints = 7;
      else if (sev === "medium") basePoints = 5;

      // Multiplier
      let multiplier = 1.0;
      if (item.dueDate) {
        const due = new Date(item.dueDate).getTime();
        if (!isNaN(due)) {
          if (due <= today) multiplier = 2.0;
          else if (due <= tomorrow) multiplier = 1.5;
        }
      }

      stats.points += (basePoints * multiplier);
    });

    const result = Object.entries(userStats).map(([name, stats]) => {
      let totalPoints = stats.points;
      
      // Context switching penalty
      if (stats.projects.size > 1) {
        totalPoints += 10;
      }

      // Level determination
      let level: 'light' | 'optimal' | 'heavy' | 'burnout' = 'light';
      if (totalPoints > 45) level = 'burnout';
      else if (totalPoints > 30) level = 'heavy';
      else if (totalPoints > 15) level = 'optimal';

      return {
        name,
        points: Math.round(totalPoints),
        level,
        projectCount: stats.projects.size,
        itemCount: stats.items
      };
    }).sort((a, b) => b.points - a.points);

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch burnout data" }, { status: 500 });
  }
}
