import { InviteManager } from "@/components/invite-manager";
import { ModuleWorkspace } from "@/components/module-workspace";
import { getModuleRows } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { isWorkspaceAdmin } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function UserManagementPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !isWorkspaceAdmin(currentUser.role)) {
    redirect("/");
  }

  const rows = await getModuleRows("users");
  const serializedRows = JSON.parse(JSON.stringify(rows));

  return (
    <ModuleWorkspace
      module="users"
      rows={serializedRows}
      currentPage={1}
      totalPages={1}
      totalItems={serializedRows.length}
      user={JSON.parse(JSON.stringify(currentUser))}
      topContent={<InviteManager embedded />}
    />
  );
}
