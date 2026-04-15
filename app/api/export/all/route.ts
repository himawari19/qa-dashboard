import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";
import { moduleConfigs } from "@/lib/modules";

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "QA Daily Hub";
    workbook.created = new Date();

    const modules = Object.keys(moduleConfigs) as (keyof typeof moduleConfigs)[];

    for (const moduleKey of modules) {
      const config = moduleConfigs[moduleKey];
      
      // Manual mapping for special table names to match lib/db.ts
      let actualTable = moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1).replace(/-/g, '');
      if (moduleKey === 'tasks') actualTable = 'Task';
      if (moduleKey === 'bugs') actualTable = 'Bug';
      if (moduleKey === 'test-cases') actualTable = 'TestCaseScenario';
      if (moduleKey === 'api-inventory') actualTable = 'ApiEndpoint';
      if (moduleKey === 'env-config') actualTable = 'EnvConfig';
      if (moduleKey === 'test-suites') actualTable = 'TestSuite';
      if (moduleKey === 'sql-snippets') actualTable = 'SqlSnippet';
      if (moduleKey === 'testing-assets') actualTable = 'TestingAsset';
      if (moduleKey === 'daily-logs') actualTable = 'DailyLog';
      if (moduleKey === 'meeting-notes') actualTable = 'MeetingNote';
      if (moduleKey === 'performance') actualTable = 'PerformanceBenchmark';
      if (moduleKey === 'workload') actualTable = 'WorkloadAssignment';

      try {
        const rows = await db.query(`SELECT * FROM "${actualTable}"`);
        
        const sheet = workbook.addWorksheet(config.title);
        
        // Define columns
        sheet.columns = config.columns.map(col => ({
          header: col.label,
          key: col.key,
          width: 20
        }));

        sheet.getRow(1).font = { bold: true };
        
        rows.forEach(row => {
          sheet.addRow(row as any);
        });
      } catch (e) {
        // Skip if table doesn't exist yet
        console.warn(`Table ${actualTable} not ready for export.`);
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
