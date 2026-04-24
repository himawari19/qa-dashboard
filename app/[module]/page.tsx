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
  let initialFormValues: Record<string, string> = {};
  let hiddenFields: string[] = [];
  try {
    rows = await getModuleRows(moduleKey as ModuleKey);
    if (moduleKey === "test-suites") {
      const plans = await getModuleRows("test-plans");
      const planMap = new Map<string, string>();
      const planTokenMap = new Map<string, string>();
      for (const plan of plans) {
        const row = plan as Record<string, unknown>;
        const id = String(row.id ?? "");
        if (!id) continue;
        planMap.set(id, String(row.title ?? ""));
        planTokenMap.set(id, String(row.publicToken ?? ""));
      }
      relatedOptions = {
        testPlanId: plans.map((plan) => {
          const row = plan as Record<string, unknown>;
          return {
            value: String(row.id ?? ""),
            label: `${String(row.title ?? "")}\n`,
          };
        }),
      };
      rows = rows.map((row) => {
        const record = row as Record<string, unknown>;
        const testPlanId = String(record.testPlanId ?? "");
        return {
          ...record,
          testPlanLabel: planMap.get(testPlanId) ?? "",
          testPlanToken: planTokenMap.get(testPlanId) ?? "",
        };
      });
      rows.sort((a, b) => {
        const planA = String(a.testPlanLabel ?? "");
        const planB = String(b.testPlanLabel ?? "");
        if (planA !== planB) return planA.localeCompare(planB);
        return String(a.title ?? "").localeCompare(String(b.title ?? ""));
      });
      const grouped = new Map<string, { start: number; count: number }>();
      rows.forEach((row, index) => {
        const key = String(row.testPlanLabel ?? "");
        const current = grouped.get(key);
        if (!current) grouped.set(key, { start: index, count: 1 });
        else current.count += 1;
      });
      rows = rows.map((row, index) => {
        const key = String(row.testPlanLabel ?? "");
        const group = grouped.get(key);
        return {
          ...row,
          testPlanRowSpan: group && group.start === index ? group.count : 0,
        };
      });
    }
    if (moduleKey === "test-plans") {
      const suites = await getModuleRows("test-suites");
      const suitesByPlan = new Map<string, Array<{ id: string; title: string; token: string }>>();
      for (const suite of suites) {
        const row = suite as Record<string, unknown>;
        const planId = String(row.testPlanId ?? "");
        if (!planId) continue;
        const list = suitesByPlan.get(planId) ?? [];
        list.push({ id: String(row.id ?? ""), title: String(row.title ?? ""), token: String(row.publicToken ?? "") });
        suitesByPlan.set(planId, list);
      }
      rows = rows.map((row) => {
        const record = row as Record<string, unknown>;
        const relatedSuites = suitesByPlan.get(String(record.id ?? "")) ?? [];
        return { ...record, relatedSuites };
      });
    }
    if (moduleKey === "test-cases") {
      const suites = await getModuleRows("test-suites");
      const plans = await getModuleRows("test-plans");
      const testCases = await getModuleRows("test-cases");
      const planMap = new Map<string, { project: string }>();
      const planLabelMap = new Map<string, string>();
      const planTokenMap = new Map<string, string>();
      const suiteStats = new Map<string, { passed: number; failed: number; total: number }>();
      for (const plan of plans) {
        const row = plan as Record<string, unknown>;
        const id = String(row.id ?? "");
        if (!id) continue;
        planMap.set(id, { project: String(row.project ?? "") });
        planLabelMap.set(id, String(row.title ?? ""));
        planTokenMap.set(id, String(row.publicToken ?? ""));
      }
      for (const tc of testCases) {
        const row = tc as Record<string, unknown>;
        const suiteId = String(row.testSuiteId ?? "");
        if (!suiteId) continue;
        const current = suiteStats.get(suiteId) ?? { passed: 0, failed: 0, total: 0 };
        current.total += 1;
        const status = String(row.status ?? "").toLowerCase();
        if (status === "passed") current.passed += 1;
        if (status === "failed") current.failed += 1;
        suiteStats.set(suiteId, current);
      }
      rows = suites.map((suite) => {
        const row = suite as Record<string, unknown>;
        const suiteId = String(row.id ?? "");
        const planId = String(row.testPlanId ?? "");
        const project = planMap.get(planId)?.project ?? "";
        const suiteLabel = String(row.title ?? "");
        return {
          id: suiteId,
          testPlanLabel: planLabelMap.get(planId) ?? "",
          suiteTitle: suiteLabel,
          projectLabel: project,
          testSuiteId: suiteId,
          publicToken: String(row.publicToken ?? ""),
          testPlanToken: planTokenMap.get(planId) ?? "",
          passed: suiteStats.get(suiteId)?.passed ?? 0,
          failed: suiteStats.get(suiteId)?.failed ?? 0,
          total: suiteStats.get(suiteId)?.total ?? 0,
        };
      });
      rows.sort((a, b) => {
        const planA = String(a.testPlanLabel ?? "");
        const planB = String(b.testPlanLabel ?? "");
        if (planA !== planB) return planA.localeCompare(planB);
        return String(a.suiteTitle ?? "").localeCompare(String(b.suiteTitle ?? ""));
      });
      const grouped = new Map<string, { start: number; count: number }>();
      rows.forEach((row, index) => {
        const key = String(row.testPlanLabel ?? "");
        const current = grouped.get(key);
        if (!current) grouped.set(key, { start: index, count: 1 });
        else current.count += 1;
      });
      rows = rows.map((row, index) => {
        const key = String(row.testPlanLabel ?? "");
        const group = grouped.get(key);
        return { ...row, testPlanRowSpan: group && group.start === index ? group.count : 0 };
      });
      relatedOptions = {};
    }
  } catch (error) {
    console.error(`Failed to load module rows for ${moduleKey}:`, error);
  }
  const plainRows = JSON.parse(JSON.stringify(rows));
  const plainRelatedOptions = JSON.parse(JSON.stringify(relatedOptions));

  return <ModuleWorkspace module={moduleKey as ModuleKey} rows={plainRows} relatedOptions={plainRelatedOptions} initialFormValues={initialFormValues} hiddenFields={hiddenFields} />;
}
