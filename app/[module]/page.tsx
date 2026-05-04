import { notFound } from "next/navigation";
import { ModuleWorkspace } from "@/components/module-workspace";
import { getAssigneeOptions, getModuleRows, getModuleRowsPage, getProjectOptions, getTestCaseStatsBySuiteIds, getTestPlanReferenceRows, getTestSuitesByPlanIds } from "@/lib/data";
import { moduleOrder, moduleConfigs, type ModuleKey } from "@/lib/modules";
import { getCurrentUser } from "@/lib/auth";
import { PAGE_SIZE } from "@/lib/pagination";

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

  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const requestedPage = Number(rawPage ?? 1);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  let rows: Record<string, unknown>[] = [];
  let totalItems = 0;
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
    const pageData = await getModuleRowsPage(moduleKey as ModuleKey, currentPage, PAGE_SIZE);
    rows = pageData.rows as Record<string, unknown>[];
    totalItems = pageData.total;
    if (moduleKey === "test-suites") {
      const plans = await getTestPlanReferenceRows();
      const planMap = new Map<string, { project: string; title: string; publicToken: string }>();
      for (const plan of plans) {
        const row = plan as any;
        const id = String(row.id ?? "");
        if (!id) continue;
        planMap.set(id, row);
      }
      
      relatedOptions = {
        testPlanId: plans.map((plan: any) => ({
          value: String(plan.id ?? ""),
          label: String(plan.title ?? ""),
        })),
      };
      const suiteStats = await getTestCaseStatsBySuiteIds(rows.map((suite: any) => suite.id));

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
      const suites = await getTestSuitesByPlanIds(rows.map((plan: any) => plan.id));
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

      // Row span logic for Project Name
      rows.sort((a: any, b: any) => {
        const projA = String(a.project ?? "");
        const projB = String(b.project ?? "");
        if (projA !== projB) return projA.localeCompare(projB);
        return String(a.title ?? "").localeCompare(String(b.title ?? ""));
      });

      const groupedProj = new Map<string, { start: number; count: number }>();
      rows.forEach((row: any, index) => {
        const key = String(row.project ?? "");
        const current = groupedProj.get(key);
        if (!current) groupedProj.set(key, { start: index, count: 1 });
        else current.count += 1;
      });
      rows = rows.map((row: any, index) => {
        const key = String(row.project ?? "");
        const group = groupedProj.get(key);
        return { ...row, projectRowSpan: group && group.start === index ? group.count : 0 };
      });
    }
    
    // Always fetch projects for modules that have a project select field
    if (["meeting-notes", "tasks", "bugs", "deployments"].includes(moduleKey)) {
      relatedOptions.project = await getProjectOptions();
    }

    // Populate any field that uses team members
    const teamOptions = await getAssigneeOptions();

    const config = moduleConfigs[moduleKey as ModuleKey];
    if (config) {
      config.fields.forEach(field => {
        if (["assignee", "tester", "suggestedDev"].includes(field.name)) {
          relatedOptions[field.name] = teamOptions;
        }
      });
    }
  } catch (error) {
    console.error(`Failed to load module rows for ${moduleKey}:`, error);
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  if (safePage !== currentPage) {
    const pageData = await getModuleRowsPage(moduleKey as ModuleKey, safePage, PAGE_SIZE);
    rows = pageData.rows as Record<string, unknown>[];
  }

  const plainRows = JSON.parse(JSON.stringify(rows));
  const plainRelatedOptions = JSON.parse(JSON.stringify(relatedOptions));

  return (
    <ModuleWorkspace 
      module={moduleKey as ModuleKey} 
      rows={plainRows} 
      currentPage={safePage}
      totalPages={totalPages}
      totalItems={totalItems} 
      relatedOptions={plainRelatedOptions} 
      initialFormValues={initialFormValues} 
      hiddenFields={hiddenFields} 
      user={JSON.parse(JSON.stringify(await getCurrentUser()))}
    />
  );
}
