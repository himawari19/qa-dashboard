import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data";

function emptyDashboardData() {
  return {
    metrics: [
      { label: "Open Tasks", value: 0, caption: "Daily QA tasks currently being managed." },
      { label: "Bug Entries", value: 0, caption: "Defects with severity, priority, and evidence." },
      { label: "Test Cases", value: 0, caption: "Positive and negative scenarios ready for use." },
      { label: "Meeting Notes", value: 0, caption: "Decision logs and meeting action items." },
      { label: "Daily Logs", value: 0, caption: "Daily testing summaries and blockers." },
    ],
    distribution: {
      tasks: [],
      bugs: [],
    },
    personalSuccessRate: 0,
    recent: {
      tasks: [],
      bugs: [],
      testCases: [],
      meetings: [],
      logs: [],
    },
    sprintInfo: null,
    bugTrendData: [],
    sprints: [],
  };
}

export async function GET() {
  try {
    const data = await Promise.race([
      getDashboardData(),
      new Promise<ReturnType<typeof emptyDashboardData>>((resolve) => {
        setTimeout(() => resolve(emptyDashboardData()), 2500);
      }),
    ]);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(emptyDashboardData());
  }
}
