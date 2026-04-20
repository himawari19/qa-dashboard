import { ModuleWorkspace } from "@/components/module-workspace";
import { getModuleRows } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TestCaseManagementPage() {
  let rowsRaw: unknown[] = [];

  try {
    rowsRaw = await getModuleRows("test-cases");
  } catch {
    rowsRaw = [];
  }

  const rows = JSON.parse(JSON.stringify(rowsRaw ?? []));

  return <ModuleWorkspace module="test-cases" rows={rows} />;
}
