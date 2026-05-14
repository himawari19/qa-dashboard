import { z } from "zod";
import { codeFromId, normalizeMultiline } from "@/lib/utils";
import { getInviteRoleOptions, getRoleExportLabel, getUserRoleOptions } from "@/lib/roles";

export type ModuleKey =
  | "tasks"
  | "bugs"
  | "test-cases"
  | "test-plans"
  | "test-sessions"
  | "test-suites"
  | "meeting-notes"
  | "assignees"
  | "sprints"
  | "users"
  | "deployments";

type Option = {
  label: string;
  value: string;
};

type Field =
  | {
      name: string;
      label: string;
      kind: "text" | "url" | "date";
      placeholder?: string;
      required?: boolean;
      readonly?: boolean;
      span?: 1 | 2 | 3;
      helperKind?: "version-sequence";
    }
  | {
      name: string;
      label: string;
      kind: "textarea";
      placeholder?: string;
      required?: boolean;
      rows?: number;
      readonly?: boolean;
      span?: 1 | 2 | 3;
      helperKind?: "version-sequence";
    }
  | {
      name: string;
      label: string;
      kind: "select";
      options: Option[];
      placeholder?: string;
      required?: boolean;
      span?: 1 | 2 | 3;
      helperKind?: "version-sequence";
    };

type Column = {
  key: string;
  label: string;
  tone?: "priority" | "severity" | "status";
  multiline?: boolean;
  link?: boolean;
  internalLink?: (row: Record<string, any>) => string;
};

type ModuleConfig = {
  title: string;
  shortTitle: string;
  description: string;
  prefix: string;
  sheetName: string;
  fields: Field[];
  columns: Column[];
  schema: z.ZodObject<any>;
  coerce: (entry: Record<string, string>) => Record<string, unknown>;
  toRow: (item: Record<string, unknown>) => Record<string, string | number>;
};

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const optionalText = z.string().trim().optional().default("");

const urlField = z
  .string()
  .trim()
  .optional()
  .default("")
  .refine((value) => !value || /^https?:\/\//.test(value) || value.startsWith("/"), {
    message: "Evidence must be an http/https URL or local file path",
  });

const priorityOptions: Option[] = ["P0", "P1", "P2", "P3"].map((value) => ({
  label: value,
  value,
}));

const taskStatusOptions: Option[] = [
  ["Todo", "todo"],
  ["Doing", "doing"],
  ["Review", "review"],
  ["Done", "done"],
  ["Blocked", "blocked"],
].map(([label, value]) => ({ label, value }));

const bugStatusOptions: Option[] = [
  ["Open", "open"],
  ["In Progress", "in_progress"],
  ["Ready to Retest", "ready_to_retest"],
  ["Closed", "closed"],
  ["Rejected", "rejected"],
].map(([label, value]) => ({ label, value }));

const deploymentStatusOptions: Option[] = [
  ["Success", "success"],
  ["Failed", "failed"],
  ["Rollback", "rollback"],
  ["In Progress", "in_progress"],
].map(([label, value]) => ({ label, value }));

const deploymentEnvOptions: Option[] = [
  ["Production", "production"],
  ["Staging", "staging"],
  ["Development", "development"],
  ["UAT", "uat"],
].map(([label, value]) => ({ label, value }));

const sprintStatusOptions: Option[] = [
  ["Planning", "planning"],
  ["Active", "active"],
  ["Completed", "completed"],
].map(([label, value]) => ({ label, value }));

const taskCategoryOptions: Option[] = [
  ["Feature", "feature"],
  ["Enhancement", "enhancement"],
  ["Bugfix", "bugfix"],
  ["Tech Debt", "tech-debt"],
  ["Research", "research"],
  ["Support", "support"],
  ["Refactor", "refactor"],
].map(([label, value]) => ({ label, value }));

const severityOptions: Option[] = [
  ["Low", "low"],
  ["Medium", "medium"],
  ["High", "high"],
  ["Critical", "critical"],
].map(([label, value]) => ({ label, value }));

const bugTypeOptions: Option[] = [
  "Functional",
  "UI/UX",
  "Performance",
  "Validation",
  "API",
  "Security",
  "Compatibility",
].map((value) => ({ label: value, value }));

const taskSchema = z.object({
  title: requiredText("Title"),
  project: requiredText("Project"),
  relatedFeature: requiredText("Feature"),
  category: z.enum(["feature", "enhancement", "bugfix", "tech-debt", "research", "support", "refactor"]),
  status: z.enum(["todo", "doing", "review", "done", "blocked"]),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  description: requiredText("Description"),
  acceptanceCriteria: requiredText("Acceptance Criteria"),
  evidence: urlField,
  assignee: optionalText,
});

const bugSchema = z.object({
  project: requiredText("Project"),
  module: requiredText("Module"),
  bugType: z.enum(["Functional", "UI/UX", "Performance", "Validation", "API", "Security", "Compatibility"]),
  title: requiredText("Title"),
  preconditions: requiredText("Preconditions"),
  stepsToReproduce: requiredText("Steps to Reproduce"),
  expectedResult: requiredText("Expected Result"),
  actualResult: requiredText("Actual Result"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  status: z.enum(["open", "in_progress", "ready_to_retest", "closed", "rejected"]),
  evidence: urlField,
});

const testCaseSchema = z.object({
  testSuiteId: requiredText("Suite ID"),
  tcId: requiredText("TC ID"),
  caseName: requiredText("Case Name"),
  assignee: optionalText,
  typeCase: z.enum(["Positive", "Negative"]),
  preCondition: requiredText("Pre-condition"),
  testStep: requiredText("Test Step"),
  expectedResult: requiredText("Expected Result"),
  actualResult: optionalText,
  status: z.enum(["Pending", "Passed", "Failed", "Blocked"]),
});

const testPlanStatusOptions: Option[] = [
  ["Draft", "draft"],
  ["Active", "active"],
  ["Closed", "closed"],
].map(([label, value]) => ({ label, value }));

const testPlanSchema = z.object({
  code: optionalText,
  title: requiredText("Plan Title"),
  project: requiredText("Project"),
  sprint: requiredText("Sprint"),
  scope: optionalText,
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  status: z.enum(["draft", "active", "closed"]),
  assignee: optionalText,
  notes: optionalText,
});

const sprintSchema = z.object({
  name: requiredText("Sprint Name"),
  startDate: requiredText("Start Date"),
  endDate: requiredText("End Date"),
  status: z.enum(["planning", "active", "completed"]),
  goal: optionalText,
});

const sessionResultOptions: Option[] = [
  ["Pass", "pass"],
  ["Fail", "fail"],
  ["Blocked", "blocked"],
  ["In Progress", "in_progress"],
].map(([label, value]) => ({ label, value }));

const testSessionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  project: requiredText("Project"),
  sprint: requiredText("Sprint"),
  tester: requiredText("Tester"),
  scope: requiredText("Scope / Modules Tested"),
  totalCases: z.string().optional().default(""),
  passed: z.string().optional().default(""),
  failed: z.string().optional().default(""),
  blocked: z.string().optional().default(""),
  result: z.enum(["pass", "fail", "blocked", "in_progress"]),
  notes: optionalText,
  evidence: urlField,
});

const suiteSchema = z.object({
  title: requiredText("Suite Name"),
  testPlanId: optionalText,
  assignee: optionalText,
  notes: optionalText,
  status: z.enum(["draft", "active", "archived"]),
});

const meetingNoteSchema = z.object({
  "date": z.string().min(1, "Date is required"),
  "project": requiredText("Project"),
  "title": requiredText("Topic"),
  "attendees": optionalText,
  "content": optionalText,
  "actionItems": optionalText,
});

const assigneeSchema = z.object({
  name: requiredText("Full Name"),
  role: optionalText,
  email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});

function normalizeEntry(entry: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(entry).map(([key, value]) => [key, normalizeMultiline(value ?? "")]),
  );
}

export const moduleConfigs: Record<ModuleKey, ModuleConfig> = {
  tasks: {
    title: "Tasks",
    shortTitle: "Tasks",
    description: "Track product work, follow-ups, and improvements in one place.",
    prefix: "TASK",
    sheetName: "Tasks",
    schema: taskSchema,
    coerce: (entry) => {
      const clean = normalizeEntry(entry);
      return {
        ...clean,
        startDate: clean.startDate ? new Date(clean.startDate) : null,
        endDate: clean.endDate ? new Date(clean.endDate) : null,
      };
    },
    toRow: (item) => ({
      ID: codeFromId("TASK", Number(item.id)),
      Title: String(item.title),
      Project: String(item.project),
      Feature: String(item.relatedFeature),
      Category: String(item.category),
      Status: String(item.status),
      Priority: String(item.priority),
      "Start Date": item.startDate ? new Date(String(item.startDate)).toISOString().slice(0, 10) : "",
      "End Date": item.endDate ? new Date(String(item.endDate)).toISOString().slice(0, 10) : "",
      Description: String(item.description),
      "Acceptance Criteria": String(item.acceptanceCriteria),
      Evidence: String(item.evidence),
      Assignee: String(item.assignee ?? ""),
    }),
    fields: [
      { name: "title", label: "Title", kind: "text", placeholder: "Add export button", required: true },
      { name: "project", label: "Project Name", kind: "select", options: [], placeholder: "Choose project", required: true },
      { name: "relatedFeature", label: "Feature", kind: "text", placeholder: "Login flow", required: true },
      { name: "category", label: "Type", kind: "select", options: taskCategoryOptions, required: true },
      { name: "status", label: "Status", kind: "select", options: taskStatusOptions, required: true },
      { name: "priority", label: "Priority", kind: "select", options: priorityOptions, required: true },
      { name: "startDate", label: "Start Date", kind: "date" },
      { name: "endDate", label: "End Date", kind: "date" },
      { name: "description", label: "Description", kind: "textarea", placeholder: "What and why.", required: true },
      { name: "acceptanceCriteria", label: "Acceptance Criteria", kind: "textarea", placeholder: "Done when...", required: true },
      { name: "assignee", label: "Assignee", kind: "select", options: [] },
      { name: "evidence", label: "Evidence", kind: "url", placeholder: "Link or screenshot" },
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "project", label: "Project Name", internalLink: (row: any) => `/test-plans/projects/${encodeURIComponent(String(row.project))}` },
      { key: "relatedFeature", label: "Feature" },
      { key: "category", label: "Type" },
      { key: "status", label: "Status", tone: "status" },
      { key: "priority", label: "Priority", tone: "priority" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "description", label: "Description", multiline: true },
      { key: "acceptanceCriteria", label: "Acceptance Criteria", multiline: true },
      { key: "assignee", label: "Assignee" },
      { key: "evidence", label: "Evidence", link: true },
    ],
  },
  bugs: {
    title: "Bugs",
    shortTitle: "Bugs",
    description: "Keep a complete register of defects with steps, results, and evidence.",
    prefix: "BUG",
    sheetName: "Bugs",
    schema: bugSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("BUG", Number(item.id)),
      Project: String(item.project),
      Module: String(item.module),
      "Bug Type": String(item.bugType),
      Title: String(item.title),
      Preconditions: String(item.preconditions),
      "Steps to Reproduce": String(item.stepsToReproduce),
      "Expected Result": String(item.expectedResult),
      "Actual Result": String(item.actualResult),
      Severity: String(item.severity),
      Priority: String(item.priority),
      Status: String(item.status),
      "Suggested Dev": String(item.suggestedDev ?? ""),
      "Related Items": String(item.relatedItems ?? ""),
      Evidence: String(item.evidence),
    }),
    fields: [
      { name: "project", label: "Project Name", kind: "text", placeholder: "e.g. Mobile App", required: true },
      { name: "module", label: "Module", kind: "text", placeholder: "e.g. Checkout", required: true },
      { name: "bugType", label: "Bug Type", kind: "select", options: bugTypeOptions, required: true },
      { name: "title", label: "Title", kind: "text", placeholder: "Title of the bug", required: true },
      { name: "preconditions", label: "Preconditions", kind: "textarea", placeholder: "Preconditions", required: true },
      { name: "stepsToReproduce", label: "Steps to Reproduce", kind: "textarea", placeholder: "Step to reproduce the bug", required: true },
      { name: "expectedResult", label: "Expected Result", kind: "textarea", placeholder: "Expected outcome", required: true },
      { name: "actualResult", label: "Actual Result", kind: "textarea", placeholder: "Actual outcome", required: true },
      { name: "severity", label: "Severity", kind: "select", options: severityOptions, required: true },
      { name: "priority", label: "Priority", kind: "select", options: priorityOptions, required: true },
      { name: "status", label: "Status", kind: "select", options: bugStatusOptions, required: true },
      { name: "suggestedDev", label: "Suggested Dev", kind: "select", options: [] },
      { name: "relatedItems", label: "Linked Items", kind: "textarea", rows: 2, placeholder: "e.g. Task #123" },
      { name: "evidence", label: "Evidence", kind: "url", placeholder: "https://example.com/log-file" },
    ],
    columns: [
      { key: "project", label: "Project Name", internalLink: (row: any) => `/test-plans/projects/${encodeURIComponent(String(row.project))}` },
      { key: "module", label: "Module" },
      { key: "bugType", label: "Bug Type" },
      { key: "title", label: "Title" },
      { key: "preconditions", label: "Preconditions", multiline: true },
      { key: "stepsToReproduce", label: "Steps to Reproduce", multiline: true },
      { key: "expectedResult", label: "Expected Result", multiline: true },
      { key: "actualResult", label: "Actual Result", multiline: true },
      { key: "severity", label: "Severity", tone: "severity" },
      { key: "priority", label: "Priority", tone: "priority" },
      { key: "status", label: "Status", tone: "status" },
      { key: "suggestedDev", label: "Suggested Dev" },
      { key: "relatedItems", label: "Linked Items", multiline: true },
      { key: "evidence", label: "Evidence", link: true },
    ],
  },
  "test-cases": {
    title: "Test Cases",
    shortTitle: "Test Cases",
    description: "Executable cases tied to a suite.",
    prefix: "TC",
    sheetName: "Test Cases",
    schema: testCaseSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: String(item.id),
      "Suite ID": String(item.testSuiteId),
      "TC ID": String(item.tcId),
      "Case Name": String(item.caseName),
      Assignee: String(item.assignee ?? ""),
      "Type Case": String(item.typeCase),
      "Pre-Condition": String(item.preCondition),
      "Test Step": String(item.testStep),
      "Expected Result": String(item.expectedResult),
      "Actual Result": String(item.actualResult ?? ""),
      Status: String(item.status),
    }),
    fields: [
      { name: "testSuiteId", label: "Suite ID", kind: "select", options: [], required: true },
      { name: "tcId", label: "TC ID", kind: "text", placeholder: "e.g. TC-001", required: true },
      { name: "caseName", label: "Case Name", kind: "text", placeholder: "e.g. Valid Login", required: true },
      { name: "assignee", label: "Assignee", kind: "select", options: [] },
      { name: "typeCase", label: "Type Case", kind: "select", options: [{ label: "Positive", value: "Positive" }, { label: "Negative", value: "Negative" }], required: true },
      { name: "preCondition", label: "Pre-condition", kind: "textarea", placeholder: "e.g. Database is clean", required: true },
      { name: "testStep", label: "Test Step", kind: "textarea", placeholder: "1. Input user\n2. Click OK", required: true },
      { name: "expectedResult", label: "Expected Result", kind: "textarea", placeholder: "Should see Dashboard", required: true },
      { name: "actualResult", label: "Actual Result", kind: "textarea", placeholder: "Observed behavior during run" },
      { name: "status", label: "Status", kind: "select", options: [{ label: "Pending", value: "Pending" }, { label: "Passed", value: "Passed" }, { label: "Failed", value: "Failed" }, { label: "Blocked", value: "Blocked" }], required: true },
    ],
    columns: [
      { key: "tcId", label: "TC ID" },
      { key: "caseName", label: "Case Name", multiline: true, internalLink: (row) => `/test-cases/detail/${row.publicToken}` },
      { key: "testSuiteId", label: "Suite ID" },
      { key: "assignee", label: "Assignee" },
      { key: "priority", label: "Priority", tone: "priority" },
      { key: "status", label: "Status", tone: "status" },
    ],
  },
  "test-plans": {
    title: "Test Plans",
    shortTitle: "Test Plans",
    description: "Top-level testing plan for a release or cycle.",
    prefix: "PLAN",
    sheetName: "Test Plans",
    schema: testPlanSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      Title: String(item.title),
      "Project Name": String(item.project),
      Sprint: String(item.sprint),
      Status: String(item.status),
      "Start Date": String(item.startDate),
      "End Date": String(item.endDate),
      Scope: String(item.scope),
    }),
    fields: [
      { name: "project", label: "Project Name", kind: "text", placeholder: "e.g. CRM System", required: true },
      { name: "title", label: "Plan Name", kind: "text", placeholder: "e.g. Sprint 12 Regression", required: true },
      { name: "sprint", label: "Sprint", kind: "text", placeholder: "e.g. Sprint 12", required: true },
      { name: "assignee", label: "Assignee", kind: "select", options: [] },
      { name: "status", label: "Status", kind: "select", options: testPlanStatusOptions, required: true },
      { name: "startDate", label: "Start Date", kind: "date" },
      { name: "endDate", label: "End Date", kind: "date" },
      { name: "scope", label: "Testing Scope", kind: "textarea", span: 1, placeholder: "Briefly describe the testing boundaries...", required: false },
      { name: "notes", label: "Notes / Exclusions", kind: "textarea", span: 1, placeholder: "Things not covered in this plan..." },
    ],
    columns: [
      { key: "title", label: "Plan Name", internalLink: (row) => `/test-plans/${row.publicToken}` },
      { key: "project", label: "Project Name", internalLink: (row) => `/test-plans/projects/${encodeURIComponent(String(row.project))}` },
      { key: "sprint", label: "Sprint" },
      { key: "startDate", label: "Start" },
      { key: "endDate", label: "End" },
      { key: "scope", label: "Testing Suite", multiline: true },
      { key: "notes", label: "Notes / Exclusions", multiline: true },
      { key: "status", label: "Status", tone: "status" },
    ],
  },
  "test-sessions": {
    title: "Test Execution",
    shortTitle: "Test Execution",
    description: "Record daily execution sessions, totals, and final outcome in one place.",
    prefix: "SES",
    sheetName: "Test Sessions",
    schema: testSessionSchema,
    coerce: (entry) => ({ 
      ...normalizeEntry(entry), 
      date: entry.date ? new Date(entry.date) : new Date() 
    }),
    toRow: (item) => ({
      ID: codeFromId("SES", Number(item.id)),
      Date: new Date(String(item.date)).toISOString().slice(0, 10),
      Project: String(item.project),
      Sprint: String(item.sprint),
      Tester: String(item.tester),
      Scope: String(item.scope),
      "Total Cases": String(item.totalCases),
      Passed: String(item.passed),
      Failed: String(item.failed),
      Blocked: String(item.blocked),
      Result: String(item.result),
    }),
    fields: [
      { name: "date", label: "Session Date", kind: "date", required: true },
      { name: "project", label: "Project Name", kind: "text", placeholder: "e.g. Web Dashboard", required: true },
      { name: "sprint", label: "Sprint", kind: "text", placeholder: "e.g. W42", required: true },
      { name: "tester", label: "Tester", kind: "select", options: [], required: true },
      { name: "scope", label: "Modules Tested", kind: "textarea", rows: 3, placeholder: "e.g. Login, Profile, Settings", required: true },
      { name: "result", label: "Overall Result", kind: "select", options: sessionResultOptions, required: true },
      { name: "totalCases", label: "Total Cases", kind: "text", placeholder: "e.g. 45" },
      { name: "passed", label: "Passed", kind: "text", placeholder: "e.g. 40" },
      { name: "failed", label: "Failed", kind: "text", placeholder: "e.g. 3" },
      { name: "blocked", label: "Blocked", kind: "text", placeholder: "e.g. 2" },
      { name: "notes", label: "Notes / Issues", kind: "textarea", rows: 3, placeholder: "Summary of failures or blockers..." },
      { name: "evidence", label: "Evidence", kind: "url", placeholder: "https://jira.example.com/ticket-123" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "project", label: "Project Name", internalLink: (row: any) => `/test-plans/projects/${encodeURIComponent(String(row.project))}` },
      { key: "sprint", label: "Sprint" },
      { key: "tester", label: "Tester" },
      { key: "result", label: "Result", tone: "status" },
      { key: "totalCases", label: "Total" },
      { key: "passed", label: "Pass" },
      { key: "failed", label: "Fail" },
      { key: "blocked", label: "Blocked" },
    ],
  },
  "test-suites": {
    title: "Test Suites",
    shortTitle: "Test Suites",
    description: "Middle layer grouping test cases under a test plan.",
    prefix: "SUITE",
    sheetName: "Suites",
    schema: suiteSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("SUITE", Number(item.id)),
      "Plan Name": String(item.testPlanId ?? ""),
      Title: String(item.title),
      Assignee: String(item.assignee ?? ""),
      Status: String(item.status),
    }),
    fields: [
      { name: "testPlanId", label: "Plan Name", kind: "select", options: [], required: true },
      { name: "title", label: "Suite Name", kind: "text", placeholder: "e.g. Checkout Flow Regression", required: true },
      { name: "assignee", label: "Assignee", kind: "select", options: [] },
      { name: "status", label: "Status", kind: "select", options: [
        { label: "Draft", value: "draft" },
        { label: "Active", value: "active" },
        { label: "Archived", value: "archived" },
      ], required: true },
      { name: "notes", label: "Goal / Notes", kind: "textarea", rows: 3, placeholder: "Describe the objective of this suite..." },
    ],
    columns: [
      { key: "title", label: "Suite Name", internalLink: (row) => `/test-suites/${row.publicToken || row.token || ""}` },
      { key: "testPlanLabel", label: "Plan Name", internalLink: (row) => `/test-plans/${row.testPlanToken}` },
      { key: "assignee", label: "Assignee" },
      { key: "notes", label: "Goal / Notes", multiline: true },
      { key: "status", label: "Status", tone: "status" },
    ],
  },
  "meeting-notes": {
    title: "Meeting Notes",
    shortTitle: "Meeting Notes",
    description: "Keep track of daily meetings, decisions made, and follow-up action items.",
    prefix: "MEET",
    sheetName: "Meetings",
    schema: meetingNoteSchema,
    coerce: (entry) => ({ ...normalizeEntry(entry), date: new Date(entry.date) }),
    toRow: (item) => ({
      ID: codeFromId("MEET", Number(item.id)),
      Date: item.date ? new Date(String(item.date)).toISOString().slice(0, 10) : "",
      Project: String(item.project),
      Topic: String(item.title),
      Attendees: String(item.attendees ?? ""),
      Content: String(item.content ?? ""),
      "Action Items": String(item.actionItems ?? ""),
      "Related Items": String(item.relatedItems ?? ""),
    }),
    fields: [
      { name: "content", label: "Discussion / Summary", kind: "textarea", placeholder: "Key discussion points and outcomes...", required: false, span: 3 },
      { name: "actionItems", label: "Action Items / Decisions", kind: "textarea", placeholder: "Who does what by when...", required: false, span: 3 },
      { name: "relatedItems", label: "Related Items", kind: "textarea", placeholder: "Link related bugs, tasks, or notes...", span: 3 },
      { name: "date", label: "Date", kind: "date", required: true },
      { name: "project", label: "Project Name", kind: "select", options: [], required: true },
      { name: "title", label: "Topic", kind: "text", placeholder: "e.g. Daily Standup", required: true },
      { name: "attendees", label: "Attendees", kind: "text", placeholder: "e.g. John, Sarah, Mike" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "project", label: "Project Name", internalLink: (row: any) => `/test-plans/projects/${encodeURIComponent(String(row.project))}` },
      { key: "title", label: "Topic" },
      { key: "attendees", label: "Attendees" },
      { key: "content", label: "Summary", multiline: true },
      { key: "actionItems", label: "Action Items", multiline: true },
      { key: "relatedItems", label: "Related Items", multiline: true },
    ],
  },
  assignees: {
    title: "Assignees",
    shortTitle: "Assignees",
    description: "Synced from user accounts for assignment across tasks, test suites, and deployment logs.",
    prefix: "USER",
    sheetName: "Assignees",
    schema: assigneeSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: String(item.id),
      Name: String(item.name),
      Role: String(item.role ?? ""),
      Email: String(item.email ?? ""),
      Skills: String(item.skills ?? ""),
      Status: String(item.status),
    }),
    fields: [
      { name: "name", label: "Full Name", kind: "text", placeholder: "e.g. John Doe", required: true },
      { name: "role", label: "Role / Title", kind: "text", placeholder: "e.g. Senior QA Engineer" },
      { name: "email", label: "Email Address", kind: "text", placeholder: "e.g. john@example.com" },
      { name: "skills", label: "Skills / Specialization", kind: "text", placeholder: "e.g. Automation, Mobile, API" },
      { name: "status", label: "Status", kind: "select", options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ], required: true },
    ],
    columns: [
      { key: "name", label: "Full Name" },
      { key: "role", label: "Role / Title" },
      { key: "email", label: "Email Address" },
      { key: "skills", label: "Skills" },
      { key: "status", label: "Status", tone: "status" },
    ],
  },
  users: {
    title: "User Management",
    shortTitle: "Users",
    description: "Manage invited user accounts, roles, and access permissions.",
    prefix: "USER",
    sheetName: "Users",
    schema: z.object({
      name: requiredText("Full Name"),
      email: requiredText("Email Address"),
      password: z.string().optional(),
      role: z.string().min(1, "Role is required"),
    }),
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: String(item.id),
      Name: String(item.name),
      Email: String(item.email ?? ""),
      Role: getRoleExportLabel(String(item.role ?? ""), String(item.company ?? "")),
    }),
    fields: [
      { name: "name", label: "Full Name", kind: "text", placeholder: "e.g. John Doe", required: true },
      { name: "email", label: "Email Address", kind: "text", placeholder: "e.g. user@example.com", required: true },
      { name: "password", label: "Password", kind: "text", placeholder: "Leave blank to keep current password" },
      { name: "role", label: "Role", kind: "select", options: getUserRoleOptions(), required: true },
    ],
    columns: [
      { key: "name", label: "Full Name" },
      { key: "email", label: "Email Address" },
      { key: "role", label: "Role", tone: "status" },
    ],
  },
  deployments: {
    title: "Deployment Log",
    shortTitle: "Deployment Log",
    description: "Track deployments, changelog, and release history.",
    prefix: "DEP",
    sheetName: "Deployments",
    schema: z.object({
      date: requiredText("Date"),
      version: requiredText("Version"),
      project: requiredText("Project"),
      environment: requiredText("Environment"),
      developer: requiredText("Developer"),
      changelog: requiredText("Changelog"),
      status: requiredText("Status"),
      notes: optionalText,
    }),
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      Date: String(item.date ?? ""),
      Version: String(item.version ?? ""),
      Project: String(item.project ?? ""),
      Environment: String(item.environment ?? ""),
      Developer: String(item.developer ?? ""),
      Changelog: String(item.changelog ?? ""),
      Status: String(item.status ?? ""),
      Notes: String(item.notes ?? ""),
    }),
    fields: [
      { name: "date", label: "Deployment Date", kind: "date", required: true },
      { name: "version", label: "Version / Tag", kind: "text", placeholder: "e.g. v1.3.0", required: true, helperKind: "version-sequence" },
      { name: "project", label: "Project", kind: "select", options: [], required: true },
      { name: "environment", label: "Environment", kind: "select", options: deploymentEnvOptions, required: true },
      { name: "developer", label: "Developer Name", kind: "select", options: [], required: true },
      { name: "status", label: "Status", kind: "select", options: deploymentStatusOptions, required: true },
      { name: "changelog", label: "Changelog", kind: "textarea", placeholder: "List changes, fixes, and new features...", required: true, span: 3 },
      { name: "notes", label: "Notes (auto-generated)", kind: "textarea", readonly: true, span: 3 },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "version", label: "Version" },
      { key: "project", label: "Project" },
      { key: "environment", label: "Environment", tone: "severity" },
      { key: "developer", label: "Developer" },
      { key: "status", label: "Status", tone: "status" },
      { key: "changelog", label: "Changelog", multiline: true },
      { key: "notes", label: "Notes", multiline: true },
    ],
  },
  sprints: {
    title: "Sprints",
    shortTitle: "Sprints",
    description: "Define sprint timelines, goals, and tracking status.",
    prefix: "SPR",
    sheetName: "Sprints",
    schema: sprintSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("SPR", Number(item.id)),
      Name: String(item.name),
      "Start Date": item.startDate ? new Date(String(item.startDate)).toISOString().slice(0, 10) : "",
      "End Date": item.endDate ? new Date(String(item.endDate)).toISOString().slice(0, 10) : "",
      Status: String(item.status),
      Goal: String(item.goal ?? ""),
    }),
    fields: [
      { name: "name", label: "Sprint Name", kind: "text", placeholder: "e.g. Sprint 24", required: true },
      { name: "project", label: "Project Name", kind: "text", placeholder: "Auto-filled from plan", readonly: true },
      { name: "testPlanTitle", label: "Plan Name", kind: "text", placeholder: "Linked from plan", readonly: true },
      { name: "startDate", label: "Start Date", kind: "date", required: true },
      { name: "endDate", label: "End Date", kind: "date", required: true },
      { name: "status", label: "Status", kind: "select", options: sprintStatusOptions, required: true },
      { name: "goal", label: "Sprint Goal", kind: "textarea", placeholder: "What do we want to achieve?", span: 3 },
    ],
    columns: [
      { key: "name", label: "Sprint Name" },
      { key: "project", label: "Project Name" },
      { key: "testPlanTitle", label: "Plan Name" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "status", label: "Status", tone: "status" },
    ],
  },
};

export const moduleOrder: ModuleKey[] = [
  "tasks",
  "bugs",
  "test-cases",
  "test-plans",
  "test-sessions",
  "test-suites",
  "meeting-notes",
  "assignees",
  "sprints",
  "users",
  "deployments",
];

export const moduleLabels = Object.fromEntries(
  moduleOrder.map((key) => [key, moduleConfigs[key].shortTitle]),
) as Record<ModuleKey, string>;

function findSelectOption(field: Extract<Field, { kind: "select" }>, value: string) {
  const lowered = value.toLowerCase();
  return field.options.find((option) => option.value === value || option.label.toLowerCase() === lowered);
}

export function formatModuleFieldValue(field: Field, value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (field.kind !== "select") return text;

  const option = findSelectOption(field, text);
  return option?.label ?? text;
}

export function normalizeModuleEntry(module: ModuleKey, entry: Record<string, string>) {
  const normalized = { ...entry };
  for (const field of moduleConfigs[module].fields) {
    if (field.kind !== "select") continue;
    const rawValue = String(entry[field.name] ?? "").trim();
    if (!rawValue) continue;
    const option = findSelectOption(field, rawValue);
    if (option) normalized[field.name] = option.value;
  }
  return normalized;
}

export function formDataToEntry(formData: FormData) {
  const entry: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") {
      entry[key] = value;
    }
  });
  return entry;
}

export function parseModuleEntry(module: ModuleKey, entry: Record<string, string>) {
  return moduleConfigs[module].schema.parse(normalizeModuleEntry(module, entry));
}

export function safeParseModuleEntry(module: ModuleKey, entry: Record<string, string>) {
  return moduleConfigs[module].schema.safeParse(normalizeModuleEntry(module, entry));
}
