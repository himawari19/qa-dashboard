import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
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

vi.mock("@/components/ui/toast", () => ({
  toast: mocks.toast,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(" "),
}));

import { TestCaseDetailEditor } from "@/components/test-case-detail-editor";

describe("TestCaseDetailEditor", () => {
  it("renders existing rows and editor controls", () => {
    const html = renderToStaticMarkup(
      <TestCaseDetailEditor
        suiteId="9"
        suiteTitle="Checkout Suite"
        initialCases={[
          {
            id: 1,
            testSuiteId: "9",
            tcId: "TC-1",
            caseName: "Login works",
            typeCase: "Positive",
            preCondition: "User exists",
            testStep: "Open login page",
            expectedResult: "Dashboard opens",
            actualResult: "",
            status: "Pending",
            evidence: "",
            priority: "High",
          },
        ]}
      />,
    );

    expect(html).toContain("TC ID");
    expect(html).toContain("TC-1");
    expect(html).toContain("Login works");
    expect(html).toContain("Action");
    expect(html).toContain("SAVE");
  });
});
