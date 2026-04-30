import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  badge: vi.fn(({ value }: { value: string }) => <span>{value}</span>),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/badge", () => ({
  Badge: mocks.badge,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(" "),
}));

import { TestCaseLibrary } from "@/app/test-cases/test-case-library";

describe("TestCaseLibrary", () => {
  it("groups cases by suite and renders the default selected suite", () => {
    const html = renderToStaticMarkup(
      <TestCaseLibrary
        cases={[
          {
            id: 1,
            tcId: "TC-1",
            caseName: "Login works",
            typeCase: "Positive",
            preCondition: "",
            testStep: "",
            expectedResult: "",
            actualResult: "",
            status: "Passed",
            priority: "High",
            evidence: "",
            suiteTitle: "Checkout Suite",
            suiteToken: "suite-1",
            suiteStatus: "active",
            planTitle: "Release Plan",
            planProject: "QA Hub",
            testSuiteId: 1,
          },
          {
            id: 2,
            tcId: "TC-2",
            caseName: "Payment fails",
            typeCase: "Negative",
            preCondition: "",
            testStep: "",
            expectedResult: "",
            actualResult: "",
            status: "Failed",
            priority: "Medium",
            evidence: "",
            suiteTitle: "Audit Suite",
            suiteToken: "suite-2",
            suiteStatus: "draft",
            planTitle: null,
            planProject: null,
            testSuiteId: 2,
          },
        ]}
      />,
    );

    expect(html).toContain("Checkout Suite");
    expect(html).toContain("Audit Suite");
    expect(html).toContain("Login works");
    expect(html).toContain("Manage");
    expect(html).toContain("Execute");
    expect(html).toContain('href="/test-cases/detail/suite-1"');
    expect(html).toContain('href="/test-suites/execute/suite-1"');
    expect(mocks.badge).toHaveBeenCalled();
  });
});
