import { ModuleWorkspace } from "@/components/module-workspace";
import { getModuleRows } from "@/lib/data";

export default async function TestCaseManagementPage() {
  const rowsRaw = await getModuleRows("test-cases");
  const rows = JSON.parse(JSON.stringify(rowsRaw));

  return <ModuleWorkspace module="test-cases" rows={rows} />;
}
