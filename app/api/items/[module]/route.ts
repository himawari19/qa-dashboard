import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createModuleRecord, deleteModuleRecord } from "@/lib/data";
import {
  formDataToEntry,
  moduleConfigs,
  moduleOrder,
  safeParseModuleEntry,
  type ModuleKey,
} from "@/lib/modules";

function assertModule(value: string): ModuleKey | null {
  return moduleOrder.includes(value as ModuleKey) ? (value as ModuleKey) : null;
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const limit = 60; // 60 requests
  const window = 60 * 1000; // 1 minute
  
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + window });
    return true;
  }
  
  if (record.count >= limit) return false;
  
  record.count++;
  return true;
}

import { logError } from "@/lib/logger";

function getValidationMessage(module: ModuleKey, error: z.ZodError) {
  const issue = error.issues[0];
  return issue?.message ?? "Invalid data provided.";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> },
) {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { module: rawModule } = await params;
  const moduleKey = assertModule(rawModule);

  if (!moduleKey) {
    return NextResponse.json({ error: "Module tidak dikenal." }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const entry = formDataToEntry(formData);
    const schema = moduleConfigs[moduleKey].schema;
    const parsed = schema.safeParse(entry);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getValidationMessage(moduleKey, parsed.error) },
        { status: 400 },
      );
    }

    const data = moduleConfigs[moduleKey].coerce(parsed.data as Record<string, string>);

    await createModuleRecord(moduleKey, data);
    revalidatePath("/");
    revalidatePath(`/${moduleKey}`);

    return NextResponse.json({
      message: `${moduleConfigs[moduleKey].shortTitle} added successfully.`,
    });
  } catch (error) {
    logError(error, `POST /api/items/${moduleKey}`);
    const message = error instanceof Error ? error.message : "Failed to save data.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> },
) {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { module: rawModule } = await params;
  const moduleKey = assertModule(rawModule);
  const id = request.nextUrl.searchParams.get("id");
  const ids = request.nextUrl.searchParams.get("ids");

  if (!moduleKey) {
    return NextResponse.json({ error: "Module tidak dikenal." }, { status: 404 });
  }

  try {
    if (ids) {
      const idList = ids.split(",");
      for (const singleId of idList) {
        await deleteModuleRecord(moduleKey, singleId);
      }
      
      revalidatePath("/");
      revalidatePath(`/${moduleKey}`);
      return NextResponse.json({
        message: `${idList.length} items deleted successfully.`,
      });
    }

    if (!id) {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    await deleteModuleRecord(moduleKey, id as string);
    revalidatePath("/");
    revalidatePath(`/${moduleKey}`);

    return NextResponse.json({
      message: `${moduleConfigs[moduleKey].shortTitle} deleted successfully.`,
    });
  } catch (error) {
    logError(error, `DELETE /api/items/${moduleKey}`);
    const message = error instanceof Error ? error.message : "Failed to delete data.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> },
) {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { module: rawModule } = await params;
  const moduleKey = assertModule(rawModule);
  
  if (!moduleKey) {
    return NextResponse.json({ error: "Module tidak dikenal." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { id, status, entry, ids } = body;

    if (Array.isArray(ids) && ids.length > 0 && status) {
      const { updateModuleStatus } = await import("@/lib/data");
      for (const itemId of ids) {
        await updateModuleStatus(moduleKey, itemId, status);
      }

      revalidatePath("/");
      revalidatePath(`/${moduleKey}`);

      return NextResponse.json({
        message: `${ids.length} items updated successfully.`,
      });
    }

    if (!id) {
      return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
    }

    if (entry && typeof entry === "object") {
      const sanitizedEntry = Object.fromEntries(
        Object.entries(entry as Record<string, unknown>).map(([key, value]) => [key, String(value ?? "")]),
      );
      const schema = moduleConfigs[moduleKey].schema;
      const parsed = schema.safeParse(sanitizedEntry);

      if (!parsed.success) {
        return NextResponse.json(
          { error: getValidationMessage(moduleKey, parsed.error) },
          { status: 400 },
        );
      }

      const { updateModuleRecord } = await import("@/lib/data");
      const data = moduleConfigs[moduleKey].coerce(parsed.data as Record<string, string>);
      await updateModuleRecord(moduleKey, id, data);

      revalidatePath("/");
      revalidatePath(`/${moduleKey}`);

      return NextResponse.json({
        message: `${moduleConfigs[moduleKey].shortTitle} updated successfully.`,
      });
    }

    if (!status) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }

    const { updateModuleStatus } = await import("@/lib/data");
    await updateModuleStatus(moduleKey, id, status);
    
    revalidatePath("/");
    revalidatePath(`/${moduleKey}`);

    return NextResponse.json({
      message: `Status updated successfully.`,
    });
  } catch (error) {
    logError(error, `PATCH /api/items/${moduleKey}`);
    const message = error instanceof Error ? error.message : "Failed to update data.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
