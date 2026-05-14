import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAccessScope } from "@/lib/data-helpers";
import { deleteFilter } from "@/lib/data";

function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

/**
 * DELETE /api/dashboard/filters/[id]
 * Soft-deletes a saved filter. Only the owner can delete.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Authentication required", "UNAUTHORIZED", 401);

  const { id: idStr } = await context.params;
  const filterId = Number(idStr);
  if (!Number.isInteger(filterId) || filterId <= 0) {
    return errorResponse("Invalid filter id", "VALIDATION_ERROR", 400);
  }

  const { company } = getAccessScope(user);

  try {
    const result = await deleteFilter(company, user.id, filterId);
    if (result.error) {
      // Distinguish ownership error from not-found for proper status codes
      if (result.error.includes("owner")) {
        return errorResponse(result.error, "FORBIDDEN", 403);
      }
      if (result.error.includes("not found")) {
        return errorResponse(result.error, "NOT_FOUND", 404);
      }
      return errorResponse(result.error, "VALIDATION_ERROR", 400);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Filters DELETE error:", error);
    return errorResponse("Failed to delete filter", "INTERNAL_ERROR", 500);
  }
}
