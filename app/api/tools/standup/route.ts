import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // 1. Get Yesterday/Last Daily Log
  const lastLog = await db.get(`
    SELECT "whatTested", "progressSummary", "blockers" 
    FROM "DailyLog" 
    ORDER BY "date" DESC LIMIT 1
  `) as any;

  // 2. Get Today's Pending Tasks
  const todayTasks = await db.query(`
    SELECT title FROM "Task" 
    WHERE status IN ('todo', 'in_progress')
    LIMIT 5
  `) as any[];

  // 3. Get Recent Bugs Found Today
  const recentBugs = await db.query(`
    SELECT title FROM "Bug" 
    WHERE DATE("createdAt") = ? 
    LIMIT 3
  `, [today]) as any[];

  const standup = {
    yesterday: lastLog ? `${lastLog.progressSummary}. Tested: ${lastLog.whatTested}` : "No daily log recorded yesterday.",
    today: todayTasks.length > 0 ? todayTasks.map((t: any) => t.title).join(", ") : "Finishing pending activities.",
    blockers: lastLog?.blockers && lastLog.blockers !== "None" ? lastLog.blockers : "None.",
    highlights: recentBugs.length > 0 ? `Found ${recentBugs.length} bugs today.` : ""
  };

  const formattedText = `*Standup Update - ${today}*\n\n` +
    `✅ *Yesterday:* ${standup.yesterday}\n` +
    `🚀 *Today:* ${standup.today}\n` +
    `⚠️ *Blocker:* ${standup.blockers}` +
    (standup.highlights ? `\n\n📌 *Extra:* ${standup.highlights}` : "");

  // #9 Standup History
  try {
    await db.run('INSERT INTO "StandupLog" ("content") VALUES (?)', [formattedText]);
  } catch (e) {}

  return NextResponse.json({ 
    raw: standup,
    formatted: formattedText
  });
}
