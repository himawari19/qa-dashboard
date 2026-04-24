import { getExecutiveData, getQualityTrend } from "@/lib/data";
import { PageShell } from "@/components/page-shell";
import { ExecutiveReportView } from "./report-view";

export const dynamic = "force-dynamic";

type ExecutiveMetric = {
  label: string;
  value: string | number;
  trend: "up" | "down" | "stable";
  status: "success" | "warning" | "danger";
};

type ReleaseItem = { code: string; title: string; severity?: string };

export default async function ExecutiveSummaryPage() {
  let data: {
    metrics: ExecutiveMetric[];
    releaseNotes: { completedTasks: ReleaseItem[]; fixedBugs: ReleaseItem[] };
    summary: { health: string; message: string; planName: string; projectName: string };
  } = {
    metrics: [],
    releaseNotes: { completedTasks: [], fixedBugs: [] },
    summary: { health: "N/A", message: "No data available.", planName: "", projectName: "" },
  };
  let trend: Array<{ label: string; bugs: number; fixed: number }> = [];

  try {
    data = JSON.parse(JSON.stringify(await getExecutiveData()));
  } catch (error) {
    console.error("Failed to load executive data:", error);
  }

  try {
    trend = JSON.parse(JSON.stringify(await getQualityTrend()));
  } catch (error) {
    console.error("Failed to load quality trend:", error);
  }

  return (
    <PageShell
      eyebrow="Strategic Insight"
      title="Executive Quality Summary"
      description="Compact health view for quality, delivery, and recent outcomes."
      className="print:bg-white"
    >
      <ExecutiveReportView data={data} trend={trend} />
    </PageShell>
  );
}
