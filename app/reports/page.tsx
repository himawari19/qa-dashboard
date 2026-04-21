import { getReportsData } from "@/lib/data";
import { ReportsCharts } from "./charts";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  let data = {
    bugSeverityData: [],
    bugStatusData: [],
    testCaseStatusData: [],
    bugTrendData: [],
  };
  try {
    data = JSON.parse(JSON.stringify(await getReportsData()));
  } catch (error) {
    console.error("Failed to load reports data:", error);
  }

  return (
    <PageShell
      eyebrow="Reports"
      title="Visual Reports"
      description="Quick charts for bug and test case trends."
    >
      <ReportsCharts {...data} />
    </PageShell>
  );
}
