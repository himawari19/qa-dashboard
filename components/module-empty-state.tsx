"use client";

type ModuleEmptyStateProps = {
  shortTitle: string;
  canAdd: boolean;
  colSpan?: number;
  onAdd: () => void;
};

export function ModuleEmptyState({ shortTitle, canAdd, colSpan = 2, onAdd }: ModuleEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="border border-[#d9e2ea] px-4 py-16 text-center dark:border-slate-700">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400 dark:bg-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor">
              <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z" />
            </svg>
          </div>
          <p className="text-base font-bold text-slate-700 dark:text-slate-200">No {shortTitle} yet</p>
          <p className="max-w-sm text-sm text-slate-400 dark:text-slate-500">
            Create the first entry to start tracking work in this module.
          </p>
          {canAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-1 inline-flex h-9 items-center gap-2 rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white dark:border-blue-900 dark:bg-slate-900 dark:hover:bg-blue-600"
            >
              Add {shortTitle}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
