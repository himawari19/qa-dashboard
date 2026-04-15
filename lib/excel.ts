import ExcelJS from "exceljs";
import { moduleConfigs, type ModuleKey } from "@/lib/modules";

const fills = {
  P0: "FFE45E5E",
  P1: "FFF97316",
  P2: "FFFACC15",
  P3: "FF38BDF8",
  critical: "FFB91C1C",
  high: "FFEF4444",
  medium: "FFFACC15",
  low: "FF86EFAC",
  open: "FFFDA4AF",
  in_progress: "FF7DD3FC",
  ready_to_retest: "FFFDBA74",
  closed: "FF86EFAC",
  rejected: "FFD4D4D8",
  todo: "FFE4E4E7",
  doing: "FF7DD3FC",
  done: "FF86EFAC",
  deferred: "FFF5D0FE",
  draft: "FFE4E4E7",
  active: "FF86EFAC",
  obsolete: "FFD4D4D8",
} as const;

function headerLabel(fieldName: string) {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

export async function buildWorkbook(
  module: ModuleKey,
  rows: Record<string, string | number>[],
  template = false,
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(moduleConfigs[module].sheetName);
  
  // Use labels from field config for headers
  const columns = moduleConfigs[module].fields.map((field) => ({
    header: field.label,
    key: field.name,
    width: Math.max(16, field.label.length + 6),
  }));

  worksheet.columns = columns;
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  // Style Header Row
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFF8FAFC" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" }, // Darker slate
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = border();
  });

  if (!template) {
    for (const row of rows) {
      // row here comes from toRow() which uses labels as keys.
      // We need to map it back to field.name keys for ExcelJS to match column keys.
      const excelData: Record<string, string | number> = {};
      moduleConfigs[module].fields.forEach(f => {
        excelData[f.name] = row[f.label] ?? "";
      });
      
      const excelRow = worksheet.addRow(excelData);
      styleDataRow(excelRow);
      applyRowColoring(module, excelRow, worksheet);
    }
  } else {
    // Add 5 empty rows for template with validation
    for (let i = 0; i < 5; i++) {
      const emptyData = Object.fromEntries(moduleConfigs[module].fields.map(f => [f.name, ""]));
      const placeholderRow = worksheet.addRow(emptyData);
      styleDataRow(placeholderRow);
    }
  }

  addDataValidation(module, worksheet);
  autoFitColumns(worksheet);

  return workbook;
}

function addDataValidation(module: ModuleKey, worksheet: ExcelJS.Worksheet) {
  moduleConfigs[module].fields.forEach((field, index) => {
    if (field.kind !== "select") return;

    const options = field.options.map((option) => option.value).join(",");
    const formula = `"${options}"`;
    
    // Apply to first 500 rows
    for (let row = 2; row <= 500; row += 1) {
      worksheet.getCell(row, index + 1).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [formula],
        showErrorMessage: true,
        errorTitle: "Invalid Selection",
        error: `Please select a value from the list for ${field.label}.`,
      };
    }
  });
}

function styleDataRow(row: ExcelJS.Row) {
  row.height = 30; // Better default height
  row.eachCell((cell) => {
    cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
    cell.border = border();
    cell.font = { size: 10, name: "Segoe UI" };
  });
}

function applyRowColoring(
  module: ModuleKey,
  row: ExcelJS.Row,
  worksheet: ExcelJS.Worksheet,
) {
  moduleConfigs[module].fields.forEach((field, index) => {
    const cell = worksheet.getCell(row.number, index + 1);
    const value = String(cell.value ?? "").toLowerCase().replace(/\s+/g, "_");
    
    // Check both raw value and normalized value for coloring
    const fill = fills[cell.value as keyof typeof fills] || fills[value as keyof typeof fills];

    if (fill) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fill },
      };
      // For dark backgrounds like P0, use white text
      if (value === "p0" || value === "critical") {
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 10 };
      }
    }

    if (field.kind === "url" && cell.value) {
      const url = String(cell.value);
      cell.value = { text: url, hyperlink: url };
      cell.font = { color: { argb: "FF2563EB" }, underline: true, size: 10 };
    }
  });
}

function autoFitColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns?.forEach((column) => {
    let maxLength = 18;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellText = String(cell.value ?? "");
      maxLength = Math.min(42, Math.max(maxLength, cellText.split("\n")[0].length + 2));
    });
    column.width = maxLength;
  });
}

function border() {
  return {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  } as ExcelJS.Borders;
}

export async function parseWorkbook(file: Uint8Array) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file as never);
  return workbook.worksheets[0];
}
