"use client";

import { CaretDown } from"@phosphor-icons/react";
import type { Dispatch, SetStateAction } from"react";
import { cn } from"@/lib/utils";
import type { FieldOption, FormField } from"@/components/module-workspace-form-field";

type Row = Record<string, unknown> & { id?: string | number };

type Props = {
 field: FormField;
 editingRow: Row | null;
 fieldError?: string;
 relatedOptions: Record<string, FieldOption[]>;
 selectValues: Record<string, string>;
 openSelectField: string | null;
 setOpenSelectField: (value: string | null) => void;
 setSelectValues: Dispatch<SetStateAction<Record<string, string>>>;
};

export function ModuleWorkspaceFormSelect({
 field,
 editingRow,
 fieldError,
 relatedOptions,
 selectValues,
 openSelectField,
 setOpenSelectField,
 setSelectValues,
}: Props) {
 const selectedValue = selectValues[field.name] ?? String(editingRow?.[field.name] ??"");
 const isLocked = Boolean(field.readonly);
 const placeholderText = field.placeholder || `Select ${field.label}`;

 if (isLocked) {
 return (
 <div className="flex min-h-10 w-full items-center rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-400 cursor-not-allowed select-none">
 {(() => {
 const options = relatedOptions[field.name] ?? field.options ?? [];
 const current = options.find((opt) => opt.value === selectedValue);
 return current?.label || String(editingRow?.[field.name] ??"—") ||"—";
 })()}
 <input type="hidden" name={field.name} value={selectedValue} readOnly />
 </div>
 );
 }

 return (
 <div className="relative" data-custom-select>
 <input type="hidden" name={field.name} value={selectedValue} readOnly />
 <button
 type="button"
 onClick={() => setOpenSelectField(openSelectField === field.name ? null : field.name)}
 className={cn(
"flex min-h-10 w-full items-center justify-between gap-3 rounded-md border bg-white px-4 py-3 text-left text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10",
 fieldError ?"border-rose-400 focus:border-rose-400 focus:ring-rose-500/10" :"border-slate-200",
 )}
 >
 <span className="whitespace-normal break-words">
 {(() => {
 const options = relatedOptions[field.name] ?? field.options ?? [];
 const current = options.find((opt) => opt.value === selectedValue);
 return current?.label || placeholderText;
 })()}
 </span>
 <CaretDown size={14} weight="bold" className="shrink-0 text-slate-400" />
 </button>
 {openSelectField === field.name && (
 <div className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full overflow-y-auto overscroll-contain rounded-md border border-slate-200 bg-white shadow-xl">
 {(relatedOptions[field.name] ?? field.options ?? []).map((option) => (
 <button
 key={option.value}
 type="button"
 onClick={() => {
 setSelectValues((p) => ({ ...p, [field.name]: option.value }));
 setOpenSelectField(null);
 }}
 className={cn(
"block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700",
 selectedValue === option.value &&"bg-emerald-50 text-emerald-700",
 )}
 >
 {option.label}
 </button>
 ))}
 </div>
 )}
 </div>
 );
}
