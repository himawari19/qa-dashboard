import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  breadcrumb: vi.fn(({ crumbs }: { crumbs: Array<{ label: string }> }) => (
    <nav>{crumbs.map((crumb) => crumb.label).join(" / ")}</nav>
  )),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: mocks.breadcrumb,
}));

vi.mock("@/components/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: vi.fn(),
}));

vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
}));

import { Dashboard } from "@/components/dashboard";

describe("Dashboard", () => {
  it("renders dashboard headers and metric cards", () => {
    const html = renderToStaticMarkup(
      <Dashboard
        metrics={[
          { label: "Open Tasks", value: 3, caption: "" },
          { label: "Bug Entries", value: 2, caption: "" },
          { label: "Test Cases", value: 4, caption: "" },
          { label: "Test Suites", value: 1, caption: "" },
          { label: "Sessions", value: 5, caption: "" },
        ]}
        distribution={{ tasks: [], bugs: [], bugByModule: [] }}
        personalSuccessRate={75}
        recent={{
          tasks: [{ id: 1, code: "TASK-001", title: "Task 1", priority: "P1", status: "todo" }],
          bugs: [{ id: 2, code: "BUG-002", title: "Bug 1", severity: "high", priority: "P1", status: "open" }],
          testCases: [{ id: "3", code: "TC-003", title: "Case 1", priority: "High", status: "Passed" }],
        }}
        recentSessions={[
          { id: 1, date: "2026-04-30", tester: "Rina", scope: "Smoke", totalCases: 3, passed: 3, failed: 0, blocked: 0, result: "passed" },
        ]}
        spotlight={{
          projectName: "QA Hub",
          totalScenarios: 4,
          totalBugs: 2,
          completionRate: 75,
          criticalBugs: [{ id: 1, code: "BUG-001", title: "Bug 1", severity: "critical" }],
          priorityTasks: [{ id: 2, code: "TASK-002", title: "Task 2", priority: "P1" }],
        }}
        bugTrendData={[]}
        todayActivity={[]}
        heatmap={[]}
        activity={[]}
      />,
    );

    expect(html).toContain("Dashboard");
    expect(html).toContain("Open Tasks");
    expect(html).toContain("Bug Entries");
    expect(html).toContain("Test Cases");
    expect(html).toContain("Standup");
    expect(mocks.breadcrumb).toHaveBeenCalled();
    expect(mocks.breadcrumb.mock.calls[0][0].crumbs).toEqual([{ label: "Dashboard" }]);
  });
});
