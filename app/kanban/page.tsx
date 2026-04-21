import React from "react";
import { db } from "@/lib/db";
import { KanbanBoardUI } from "@/components/kanban-board-ui";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  let allItems: any[] = [];
  try {
    const tasks = await db.query('SELECT * FROM "Task"');
    const bugs = await db.query('SELECT * FROM "Bug"');
    allItems = [
      ...tasks.map((t: any) => ({ ...t, type: "task" })),
      ...bugs.map((b: any) => ({ ...b, type: "bug" })),
    ];
  } catch (error) {
    console.error("Failed to load kanban data:", error);
  }

  return (
    <PageShell
      eyebrow="Kanban"
      title="QA Kanban Board"
      description="Unified view of all tasks and bugs across projects."
    >
      <KanbanBoardUI initialItems={allItems} />
    </PageShell>
  );
}
