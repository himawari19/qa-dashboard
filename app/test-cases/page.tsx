import { getAllTestCasesWithSuite } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { TestCaseLibrary } from "./test-case-library";
import { Checks } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function TestCasesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawCases = await getAllTestCasesWithSuite();
  const cases = JSON.parse(JSON.stringify(rawCases));
  const query = searchParams ? await searchParams : {};
  const initialSearch = typeof query.q === "string" ? query.q : Array.isArray(query.q) ? query.q[0] : "";

  return (
    <PageShell
      icon={<Checks size={18} weight="bold" />}
      eyebrow="Test Management"
      title="Test Case Library"
      description="All test cases across every suite. Filter by status, review assignee ownership, and jump directly to execution."
      crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Test Cases" }]}
    >
      <TestCaseLibrary key={initialSearch} cases={cases} initialSearch={initialSearch} />
    </PageShell>
  );
}
