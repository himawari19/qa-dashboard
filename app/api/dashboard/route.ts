import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data";

function emptyDashboardData() {
  return {
    metrics: [
      { label: "Open Tasks", value: 0, caption: "Daily QA tasks currently being managed." },
      { label: "Bug Entries", value: 0, caption: "Defects with severity, priority, and evidence." },
      { label: "Test Cases", value: 0, caption: "Positive and negative scenarios ready for use." },
    ],
    distribution: {
      tasks: [],
      bugs: [],
      bugByModule: [],
    },
    todayActivity: [],
    personalSuccessRate: 0,
    recent: {
      tasks: [],
      bugs: [],
      testCases: [],
    },
    sprintInfo: null,
    bugTrendData: [],
    sprints: [],
    activity: [],
    spotlight: {
       projectName: "No active project",
       projectDescription: "Track and monitor QA progress across modules.",
       totalScenarios: 0,
       totalBugs: 0,
       completionRate: 0,
       criticalBugs: [],
       priorityTasks: []
    }
  };
}

export async function GET() {
  try {
    const timeoutMs = 2500;
    let timedOut = false;
    const data = await Promise.race([
      getDashboardData(),
      new Promise<any>((resolve) => {
        setTimeout(() => {
          timedOut = true;
          resolve(emptyDashboardData());
        }, timeoutMs);
      }),
    ]);
    if (timedOut) {
      return NextResponse.json(data, {
        headers: { "X-Dashboard-Timeout": "true" },
      });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(emptyDashboardData(), { status: 500 });
  }
}
