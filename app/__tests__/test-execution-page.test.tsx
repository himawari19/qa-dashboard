import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  pageShell: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
  executionSuiteGroup: vi.fn(() => <div data-testid="execution-suite-group" />),
  getModuleRows: vi.fn(),
}));

vi.mock("@/components/page-shell", () => ({
  PageShell: mocks.pageShell,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/data", () => ({
  getModuleRows: mocks.getModuleRows,
}));

vi.mock("@/app/test-execution/execution-suite-group", () => ({
  ExecutionSuiteGroup: mocks.executionSuiteGroup,
}));

import TestExecutionPage from "@/app/test-execution/page";

describe("test execution page", () => {
  it("groups active suites by plan and renders execution groups", async () => {
    mocks.getModuleRows.mockImplementation(async (module: string) => {
      if (module === "test-suites") {
        return [
          { id: 1, status: "active", testPlanId: "10" },
          { id: 2, status: "draft", testPlanId: "10" },
          { id: 3, status: "active", testPlanId: null },
          { id: 4, status: "archived", testPlanId: "99" },
        ];
      }

      if (module === "test-plans") {
        return [
          { id: 10, title: "Plan Alpha", project: "QA Hub" },
        ];
      }

      return [];
    });

    const element = await TestExecutionPage();
    const html = renderToStaticMarkup(element);

    expect(mocks.getModuleRows).toHaveBeenNthCalledWith(1, "test-suites");
    expect(mocks.getModuleRows).toHaveBeenNthCalledWith(2, "test-plans");
    expect(html).toContain("Plan Alpha");
    expect(html).toContain("Standalone Suites");
    expect(mocks.executionSuiteGroup).toHaveBeenCalledTimes(2);
    const props = (mocks.pageShell as unknown as { mock: { calls: Array<[Record<string, unknown>]> } }).mock.calls[0]![0];
    expect(props).toEqual(expect.objectContaining({
      title: "Execution Center",
      eyebrow: "Execution",
      description: "Select a test suite to begin your execution session. All results are tracked automatically.",
    }));
  });
});
