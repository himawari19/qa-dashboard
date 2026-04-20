"use client";

import React from "react";
import { Badge } from "@/components/badge";
import { Bug, Kanban, Checks } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type KanbanItem = {
  id: number;
  title: string;
  status: string;
  type: 'task' | 'bug';
  project: string;
  priority?: string;
  severity?: string;
};

export function KanbanBoardUI({ initialItems }: { initialItems: KanbanItem[] }) {
  const columns = [
    { title: "To Do", status: "todo", color: "bg-slate-100", border: "border-slate-200" },
    { title: "In Progress", status: "doing", color: "bg-sky-50", border: "border-sky-200" },
    { title: "Fixed / Done", status: "done", color: "bg-emerald-50", border: "border-emerald-200" }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {columns.map((col) => (
        <div key={col.status} className={cn("min-h-[520px] rounded-[32px] border p-5 flex flex-col", col.border, col.color)}>
           <div className="mb-4 flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{col.title}</h3>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500 shadow-sm ring-1 ring-slate-200">
                {initialItems.filter(i => i.status.toLowerCase() === col.status).length}
              </span>
           </div>
           
           <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
             {initialItems.filter(i => i.status.toLowerCase() === col.status).map((item) => (
               <div key={`${item.type}-${item.id}`} className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-1">
                 <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg shadow-sm",
                      item.type === 'bug' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'
                    )}>
                      {item.type === 'bug' ? <Bug size={14} weight="bold" /> : <Kanban size={14} weight="bold" />}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 truncate max-w-[100px]">{item.project}</span>
                 </div>
                 
                 <p className="text-xs font-bold text-slate-800 leading-relaxed mb-4 line-clamp-2">{item.title}</p>
                 
                 <div className="flex flex-wrap gap-1.5">
                    {item.priority && <Badge value={item.priority} />}
                    {item.severity && <Badge value={item.severity} />}
                 </div>
               </div>
             ))}
             {initialItems.filter(i => i.status.toLowerCase() === col.status).length === 0 && (
               <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-2xl text-slate-300">
                 <Checks size={32} weight="thin" />
                 <p className="text-[10px] font-bold uppercase mt-2">Column Empty</p>
               </div>
             )}
           </div>
        </div>
      ))}
    </div>
  );
}
