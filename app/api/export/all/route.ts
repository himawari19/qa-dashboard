import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";
import { moduleConfigs } from "@/lib/modules";
import { getTableName } from "@/lib/data";

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "QA Daily Hub";
    workbook.created = new Date();

    const modules = Object.keys(moduleConfigs) as (keyof typeof moduleConfigs)[];

    for (const moduleKey of modules) {
      const config = moduleConfigs[moduleKey];
      const tableName = getTableName(moduleKey);

      try {
        const rows = await db.query(`SELECT * FROM "${tableName}"`);
        
        const sheet = workbook.addWorksheet(config.title);
        
        // Define columns
        sheet.columns = config.columns.map(col => ({
          header: col.label,
          key: col.key,
          width: 20
        }));

        sheet.getRow(1).font = { bold: true };
        
        rows.forEach(row => {
          sheet.addRow(row as Record<string, unknown>);
        });
      } catch {
        // Skip if table doesn't exist yet
        console.warn(`Table ${tableName} not ready for export.`);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="QA_Dashboard_Export.xlsx"',
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
