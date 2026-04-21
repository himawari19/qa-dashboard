import { PageShell } from "@/components/page-shell";
import { ApiTestingRunner } from "@/components/api-testing-runner";
import { db } from "@/lib/db";
import { codeFromId } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getEndpoints() {
  const rows = await db.query('SELECT * FROM "ApiEndpoint" ORDER BY "updatedAt" DESC') as Record<string, unknown>[];
  const plain = JSON.parse(JSON.stringify(rows));
  return plain.map((row: Record<string, unknown>) => ({
    ...row,
    id: Number(row.id),
    code: codeFromId("API", Number(row.id)),
  }));
}

async function getRuns() {
  const rows = await db.query('SELECT * FROM "ApiTestRun" ORDER BY "updatedAt" DESC, id DESC LIMIT 20') as Record<string, unknown>[];
  return JSON.parse(JSON.stringify(rows));
}

export default async function ApiTestingPage() {
  let endpoints: Record<string, unknown>[] = [];
  let runs: Record<string, unknown>[] = [];
  try {
    endpoints = await getEndpoints();
  } catch (error) {
    console.error("Failed to load API endpoints:", error);
  }
  try {
    runs = await getRuns();
  } catch (error) {
    console.error("Failed to load API runs:", error);
  }

  return (
    <PageShell
      eyebrow="API TESTING"
      title="API Testing"
      description="Save endpoints, run requests, and keep history in the internal database."
      controls={
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full border border-slate-200 px-3 py-1">Saved APIs: {endpoints.length}</span>
          <span className="rounded-full border border-slate-200 px-3 py-1">Runs: {runs.length}</span>
        </div>
      }
    >
      <ApiTestingRunner endpoints={endpoints as any[]} runs={runs as any[]} />
    </PageShell>
  );
}
