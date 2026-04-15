import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { clearModuleRecords, replaceModuleRecords } from "@/lib/data";
import { parseWorkbook } from "@/lib/excel";
import {
  moduleConfigs,
  moduleOrder,
  safeParseModuleEntry,
  type ModuleKey,
} from "@/lib/modules";

function assertModule(value: string): ModuleKey | null {
  return moduleOrder.includes(value as ModuleKey) ? (value as ModuleKey) : null;
}

function headerKey(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  const { module: rawModule } = await params;
  const moduleKey = assertModule(rawModule);

  if (!moduleKey) {
    return NextResponse.json({ error: "Module tidak dikenal." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File .xlsx wajib diunggah." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const worksheet = await parseWorkbook(buffer);

  if (!worksheet) {
    return NextResponse.json({ error: "Worksheet tidak ditemukan." }, { status: 400 });
  }

  const expectedFields = moduleConfigs[moduleKey].fields.map((field) => ({
    name: field.name,
    label: field.label,
  }));

  const headerValues = worksheet.getRow(1).values;
  const headers = (Array.isArray(headerValues) ? headerValues.slice(1) : [])
    .map((value) => headerKey(String(value ?? "")));

  const fieldIndex = new Map(
    expectedFields.map((field) => [headerKey(field.label), field.name]),
  );

  const rows: Record<string, unknown>[] = [];
  const errors: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const entry: Record<string, string> = {};

    headers.forEach((header, index) => {
      const field = fieldIndex.get(header);
      if (!field) return;
      entry[field] = String(row.getCell(index + 1).text ?? "").trim();
    });

    const isEmpty = Object.values(entry).every((value) => value === "");
    if (isEmpty) return;

    const parsed = safeParseModuleEntry(moduleKey, entry);
    if (!parsed.success) {
      errors.push(
        `Baris ${rowNumber}: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`,
      );
      return;
    }

    rows.push(moduleConfigs[moduleKey].coerce(parsed.data as Record<string, string>));
  });

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" | ") }, { status: 400 });
  }

  await clearModuleRecords(moduleKey);
  await replaceModuleRecords(moduleKey, rows);
  revalidatePath("/");
  revalidatePath(`/${moduleKey}`);

  return NextResponse.json({
    message: `${rows.length} baris ${moduleConfigs[moduleKey].shortTitle} berhasil diimport.`,
  });
}
