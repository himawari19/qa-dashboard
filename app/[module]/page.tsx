import { notFound } from "next/navigation";
import { ModuleWorkspace } from "@/components/module-workspace";
import { getModuleRows } from "@/lib/data";
import { moduleOrder, type ModuleKey } from "@/lib/modules";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return moduleOrder.map((module) => ({ module }));
}

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { module: rawModule } = await params;
  const query = searchParams ? await searchParams : {};
  const moduleKey = rawModule;
  if (!moduleOrder.includes(moduleKey as ModuleKey)) {
    notFound();
  }

  let rows: Record<string, unknown>[] = [];
  let relatedOptions: Record<string, Array<{ label: string; value: string }>> = {};
  const initialFormValues: Record<string, string> = {};
  
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (typeof v === "string") initialFormValues[k] = v;
      else if (Array.isArray(v) && v.length > 0) initialFormValues[k] = v[0];
    }
  }

  const hiddenFields: string[] = [];
  try {
    rows = await getModuleRows(moduleKey as ModuleKey);
    if (moduleKey === "test-suites") {
      const plans = await getModuleRows("test-plans");
      const planMap = new Map<string, { project: string; title: string; publicToken: string }>();
      const planLabelMap = new Map<string, string>();
      const planTokenMap = new Map<string, string>();
      for (const plan of plans) {
        const row = plan as any;
        const id = String(row.id ?? "");
        if (!id) continue;
        planMap.set(id, row);
        planLabelMap.set(id, String(row.title ?? ""));
        planTokenMap.set(id, String(row.publicToken ?? ""));
      }
      
      relatedOptions = {
        testPlanId: plans.map((plan: any) => ({
          value: String(plan.id ?? ""),
          label: String(plan.title ?? ""),
        })),
      };

      // Get test cases for stats
      const allCases = await getModuleRows("test-cases");
      const suiteStats = new Map<string, { passed: number; failed: number; total: number }>();
      for (const tc of allCases) {
        const row = tc as any;
        const suiteId = String(row.testSuiteId ?? "");
        const current = suiteStats.get(suiteId) ?? { passed: 0, failed: 0, total: 0 };
        current.total += 1;
        const status = String(row.status ?? "").toLowerCase();
        if (status === "passed") current.passed += 1;
        if (status === "failed") current.failed += 1;
        suiteStats.set(suiteId, current);
      }

      rows = rows.map((suite: any) => {
        const suiteId = String(suite.id ?? "");
        const planId = String(suite.testPlanId ?? "");
        const plan = planMap.get(planId);
        return {
          ...suite,
          testPlanLabel: plan?.title ?? "",
          testPlanToken: plan?.publicToken ?? "",
          projectLabel: plan?.project ?? "",
          testSuiteId: suiteId,
          publicToken: String(suite.publicToken ?? ""),
          passed: suiteStats.get(suiteId)?.passed ?? 0,
          failed: suiteStats.get(suiteId)?.failed ?? 0,
          total: suiteStats.get(suiteId)?.total ?? 0,
        };
      });

      rows.sort((a: any, b: any) => {
        if (a.testPlanLabel !== b.testPlanLabel) return a.testPlanLabel.localeCompare(b.testPlanLabel);
        return String(a.title ?? "").localeCompare(String(b.title ?? ""));
      });

      const grouped = new Map<string, { start: number; count: number }>();
      rows.forEach((row: any, index) => {
        const key = row.testPlanLabel;
        const current = grouped.get(key);
        if (!current) grouped.set(key, { start: index, count: 1 });
        else current.count += 1;
      });
      rows = rows.map((row: any, index) => {
        const key = row.testPlanLabel;
        const group = grouped.get(key);
        return { ...row, testPlanRowSpan: group && group.start === index ? group.count : 0 };
      });
    }

    if (moduleKey === "test-plans") {
      const suites = await getModuleRows("test-suites");
      const suitesByPlan = new Map<string, any[]>();
      for (const suite of suites) {
        const row = suite as any;
        const planId = String(row.testPlanId ?? "");
        if (!planId) continue;
        const list = suitesByPlan.get(planId) ?? [];
        list.push({ id: row.id, title: row.title, token: row.publicToken });
        suitesByPlan.set(planId, list);
      }
      rows = rows.map((row: any) => ({
        ...row,
        relatedSuites: suitesByPlan.get(String(row.id)) ?? []
      }));
    }
  } catch (error) {
    console.error(`Failed to load module rows for ${moduleKey}:`, error);
  }

  const plainRows = JSON.parse(JSON.stringify(rows));
  const plainRelatedOptions = JSON.parse(JSON.stringify(relatedOptions));

  return (
    <ModuleWorkspace 
      module={moduleKey as ModuleKey} 
      rows={plainRows} 
      relatedOptions={plainRelatedOptions} 
      initialFormValues={initialFormValues} 
      hiddenFields={hiddenFields} 
    />
  );
}
