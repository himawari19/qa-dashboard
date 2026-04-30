import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  pageShell: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
  breadcrumb: vi.fn(({ crumbs }: { crumbs: Array<{ label: string }> }) => (
    <nav>{crumbs.map((crumb) => crumb.label).join(" / ")}</nav>
  )),
  badge: vi.fn(({ value }: { value: string }) => <span>{value}</span>),
  getProjectData: vi.fn(),
  formatDate: vi.fn((value: string) => value),
}));

vi.mock("@/components/page-shell", () => ({
  PageShell: mocks.pageShell,
}));

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: mocks.breadcrumb,
}));

vi.mock("@/components/badge", () => ({
  Badge: mocks.badge,
}));

vi.mock("@/lib/data", () => ({
  getProjectData: mocks.getProjectData,
}));

vi.mock("@/lib/utils", () => ({
  formatDate: mocks.formatDate,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import ProjectDetailPage from "@/app/projects/[name]/page";

describe("project detail page", () => {
  it("renders project overview from loaded data", async () => {
    mocks.getProjectData.mockResolvedValueOnce({
      stats: {
        successRate: 82,
        passed: 14,
        totalCases: 17,
        totalBugs: 4,
        totalTasks: 6,
        totalPlans: 2,
      },
      plans: [
        { id: "1", publicToken: "plan-1", title: "Plan Alpha", sprint: "Sprint 1", status: "active" },
      ],
      bugs: [
        { id: 1, code: "BUG-1", title: "Critical login issue", module: "Auth", severity: "high" },
      ],
      meetings: [
        { id: 1, code: "MTG-1", date: "2026-04-30", title: "Weekly sync" },
      ],
    });

    const element = await ProjectDetailPage({ params: Promise.resolve({ name: "QA%20Hub" }) });
    const html = renderToStaticMarkup(element);

    expect(mocks.getProjectData).toHaveBeenCalledWith("QA Hub");
    expect(html).toContain("Plan Alpha");
    expect(html).toContain("Critical login issue");
    expect(html).toContain("Weekly sync");
    const props = (mocks.pageShell as unknown as { mock: { calls: Array<[Record<string, unknown>]> } }).mock.calls[0]![0];
    expect(props).toEqual(expect.objectContaining({
      title: "QA Hub",
      eyebrow: "Project Name",
      description: "Comprehensive project quality overview and activity tracking.",
    }));
  });
});
