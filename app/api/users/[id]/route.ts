import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, username, role, password } = body;

  try {
    if (password) {
      const { hashPassword } = await import("@/lib/auth-core");
      const hashedPassword = await hashPassword(password);
      await db.run(
        'UPDATE "User" SET "name" = ?, "username" = ?, "role" = ?, "password" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?',
        [name, username, role, hashedPassword, id]
      );
    } else {
      await db.run(
        'UPDATE "User" SET "name" = ?, "username" = ?, "role" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?',
        [name, username, role, id]
      );
    }
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
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  
  // Prevent deleting self? id 0 is static admin, but DB users have real IDs.
  // We should check if they are deleting their own DB account.
  if (parseInt(id) === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
  }

  try {
    await db.run('DELETE FROM "User" WHERE "id" = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
