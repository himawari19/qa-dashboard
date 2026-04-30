import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/auth-core";
import {
  getActivityResults,
  getAssigneeResults,
  getBugResults,
  getDeploymentResults,
  getMeetingResults,
  getPlanResults,
  getSessionResults,
  getSprintResults,
  getSuiteResults,
  getTaskResults,
  getTestCaseResults,
  getUserResults,
} from "./search-query-builders";
import { getScope, SECTION_LABELS, SCOPE_LABELS } from "./search-helpers";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const scope = getScope(request.nextUrl.searchParams.get("scope"));
  const company = user.company || "";
  const isAdmin = isAdminUser(user.role, company);
  const companyClause = isAdmin ? "" : ` AND "company" = ?`;
  const companyParams = isAdmin ? [] : [company];

  const queryTasks = scope === "all" || scope === "tasks" ? getTaskResults(q, companyClause, companyParams) : Promise.resolve([]);
  const queryBugs = scope === "all" || scope === "bugs" ? getBugResults(q, companyClause, companyParams) : Promise.resolve([]);
  const queryPlans = scope === "all" || scope === "test-plans" ? getPlanResults(q, companyClause, companyParams) : Promise.resolve([]);
  const querySuites = scope === "all" || scope === "test-suites" ? getSuiteResults(q, companyClause, companyParams) : Promise.resolve([]);
  const queryCases = scope === "all" || scope === "test-cases" ? getTestCaseResults(q, companyClause, companyParams) : Promise.resolve([]);
  const querySessions = scope === "all" || scope === "test-sessions" ? getSessionResults(q, companyClause, companyParams) : Promise.resolve([]);
  const queryMeetings = scope === "all" || scope === "meeting-notes" ? getMeetingResults(q, companyClause, companyParams) : Promise.resolve([]);
  const querySprints = scope === "all" || scope === "sprints" ? getSprintResults(q, companyClause, companyParams) : Promise.resolve([]);
  const queryAssignees = scope === "all" || scope === "assignees" ? getAssigneeResults(q, companyClause, companyParams) : Promise.resolve([]);
  const queryUsers = scope === "all" || scope === "users" ? getUserResults(q, companyClause, companyParams) : Promise.resolve([]);
  const queryDeployments = scope === "all" || scope === "deployments" ? getDeploymentResults(q, companyClause, companyParams) : Promise.resolve([]);
  const queryActivity = scope === "all" || scope === "activity" ? getActivityResults(q, companyClause, companyParams) : Promise.resolve([]);

  const arrays = await Promise.all([
    queryTasks,
    queryBugs,
    queryPlans,
    querySuites,
    queryCases,
    querySessions,
    queryMeetings,
    querySprints,
    queryAssignees,
    queryUsers,
    queryDeployments,
    queryActivity,
  ]);

  const results = arrays
    .flat()
    .sort((a, b) => b.score - a.score || a.group.localeCompare(b.group) || a.label.localeCompare(b.label))
    .slice(0, 24);

  return NextResponse.json({
    query: q,
    scope,
    scopeLabel: SCOPE_LABELS[scope] ?? "All",
    sectionLabels: SECTION_LABELS,
    results,
  });
}
