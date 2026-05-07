import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser, isInviteRole, normalizeRole } from "@/lib/roles";
import { deleteAssigneeForUser, syncAssigneeFromUser } from "@/lib/user-assignee-sync";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user.role, user.company)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
    const { name, email, role, password } = body;
  const normalizedRole = normalizeRole(role);
  if (!isInviteRole(normalizedRole) && normalizedRole !== "admin") {
    return NextResponse.json({ error: "Role is not allowed." }, { status: 400 });
  }

  try {
    if (password) {
      const { hashPassword } = await import("@/lib/auth-core");
      const hashedPassword = await hashPassword(password);
      await db.run(
        'UPDATE "User" SET "name" = ?, "email" = ?, "role" = ?, "password" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = CAST(? AS INTEGER)',
        [name, email, normalizedRole, hashedPassword, id]
      );
    } else {
      await db.run(
        'UPDATE "User" SET "name" = ?, "email" = ?, "role" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = CAST(? AS INTEGER)',
        [name, email, normalizedRole, id]
      );
    }
    await syncAssigneeFromUser({
      id: Number(id),
      company: user.company,
      name,
      email,
      role: normalizedRole,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !isAdminUser(user.role, user.company)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  
  if (parseInt(id) === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
  }

  try {
    await deleteAssigneeForUser(Number(id));
    await db.run('DELETE FROM "User" WHERE "id" = CAST(? AS INTEGER)', [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
