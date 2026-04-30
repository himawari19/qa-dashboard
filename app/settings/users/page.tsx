import { PageShell } from "@/components/page-shell";
import { ModuleWorkspace } from "@/components/module-workspace";
import { getModuleRows } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth-core";
import { redirect } from "next/navigation";

export default async function UserManagementPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isAdminUser(currentUser.role, currentUser.company)) {
    redirect("/dashboard");
  }

  const rows = await getModuleRows("users");
  const serializedRows = JSON.parse(JSON.stringify(rows));

  return (
    <ModuleWorkspace 
      module="users" 
      rows={serializedRows} 
      user={JSON.parse(JSON.stringify(currentUser))}
    />
  );
}
