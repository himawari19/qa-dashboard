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
      title="Visual Insights"
      description="Summarized bug and test case data represented in graphical format to assist daily tracking and quality analysis."
    >
      <ReportsCharts {...data} />
    </PageShell>
  );
}
