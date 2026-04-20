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
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: rawModule } = await params;
  const moduleKey = rawModule === "test-case-management" ? "test-cases" : rawModule;
  if (!moduleOrder.includes(moduleKey as ModuleKey)) {
    notFound();
  }

  let rows: Record<string, unknown>[] = [];
  try {
    rows = await getModuleRows(moduleKey as ModuleKey);
  } catch (error) {
    console.error(`Failed to load module rows for ${moduleKey}:`, error);
  }
  const plainRows = JSON.parse(JSON.stringify(rows));

  return <ModuleWorkspace module={moduleKey as ModuleKey} rows={plainRows} />;
}
