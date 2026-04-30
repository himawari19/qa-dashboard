import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  breadcrumb: vi.fn(({ crumbs }: { crumbs: Array<{ label: string }> }) => (
    <nav>{crumbs.map((crumb) => crumb.label).join(" / ")}</nav>
  )),
  badge: vi.fn(({ value }: { value: string }) => <span>{value}</span>),
  routerPush: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.routerPush,
    refresh: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: mocks.breadcrumb,
}));

vi.mock("@/components/badge", () => ({
  Badge: mocks.badge,
}));

vi.mock("@/components/ui/toast", () => ({
  toast: mocks.toast,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(" "),
  formatDate: (value: string) => value,
}));

import { SuiteExecutionView } from "@/app/test-suites/execute/[id]/execution-view";

describe("SuiteExecutionView", () => {
  it("renders execution controls and test case list", () => {
    const html = renderToStaticMarkup(
      <SuiteExecutionView
        suite={{
          project: "QA Hub",
          sprint: "Sprint 5",
          title: "Checkout Suite",
        }}
        cases={[
          {
            id: 1,
            code: "TC-1",
            caseName: "Login works",
            preCondition: "User exists",
            testStep: "Open login page",
            expectedResult: "Dashboard opens",
            actualResult: "",
            status: "Passed",
          },
        ]}
        scenarioId="9"
        suiteToken="suite-1"
      />,
    );

    expect(html).toContain("Checkout Suite");
    expect(html).toContain("Login works");
    expect(html).toContain("Execute Session");
    expect(html).toContain("Finish Session");
    expect(mocks.breadcrumb).toHaveBeenCalled();
  });
});
