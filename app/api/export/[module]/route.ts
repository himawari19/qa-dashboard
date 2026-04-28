import { NextRequest, NextResponse } from "next/server";
import { buildWorkbook } from "@/lib/excel";
import { getModuleSheetRows } from "@/lib/data";
import { moduleConfigs, moduleOrder, type ModuleKey } from "@/lib/modules";
import { getCurrentUser } from "@/lib/auth";

function assertModule(value: string): ModuleKey | null {
  return moduleOrder.includes(value as ModuleKey) ? (value as ModuleKey) : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { module: rawModule } = await params;
  const moduleKey = assertModule(rawModule);
  const template = request.nextUrl.searchParams.get("template") === "1";

  if (!moduleKey) {
    return NextResponse.json({ error: "Unknown module." }, { status: 404 });
  }

  const workbook = await buildWorkbook(
    moduleKey,
    template ? [] : await getModuleSheetRows(moduleKey),
    template,
  );
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${moduleKey}-${template ? "template" : "export"}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Sheet-Name": moduleConfigs[moduleKey].sheetName,
    },
  });
}
