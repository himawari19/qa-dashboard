import React from "react";
import { db } from "@/lib/db";
import { KanbanBoardUI } from "@/components/kanban-board-ui";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const tasks = await db.query('SELECT * FROM "Task"');
  const bugs = await db.query('SELECT * FROM "Bug"');

  // Combine and format for Kanban
  const allItems = [
    ...tasks.map((t: any) => ({ ...t, type: 'task' })),
    ...bugs.map((b: any) => ({ ...b, type: 'bug' }))
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">QA Kanban Board</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Unified view of all tasks and bugs across projects.</p>
      </header>
      
      <KanbanBoardUI initialItems={allItems} />
    </div>
  );
}
