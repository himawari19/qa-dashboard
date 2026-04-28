import { getAllTestCasesWithSuite } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { TestCaseLibrary } from "./test-case-library";

export const dynamic = "force-dynamic";

export default async function TestCasesPage() {
  const rawCases = await getAllTestCasesWithSuite();
  const cases = JSON.parse(JSON.stringify(rawCases));

  return (
    <PageShell
      eyebrow="Test Management"
      title="Test Case Library"
      description="All test cases across every suite. Filter, review, and jump directly to execution."
      crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Test Cases" }]}
    >
      <TestCaseLibrary cases={cases} />
    </PageShell>
  );
}
