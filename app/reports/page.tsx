import { getReportsData } from "@/lib/data";
import { ReportsCharts } from "./charts";

export default async function ReportsPage() {
  const dataRaw = await getReportsData();
  const data = JSON.parse(JSON.stringify(dataRaw));

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Reports</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Visual Insights</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 print:hidden">
          Summarized bug and test case data represented in graphical format to assist in daily tracking and quality analysis.
        </p>
      </div>
      <ReportsCharts {...data} />
    </section>
  );
}
