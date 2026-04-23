import { z } from "zod";
import { codeFromId, normalizeMultiline } from "@/lib/utils";

export type ModuleKey =
  | "tasks"
  | "bugs"
  | "test-cases"
  | "meeting-notes"
  | "daily-logs"
  | "api-testing"
  | "workload"
  | "performance"
  | "env-config"
  | "test-plans"
  | "test-sessions"
  | "test-suites"
  | "sql-snippets"
  | "testing-assets";

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
    }
  | {
      name: string;
      label: string;
      kind: "textarea";
      placeholder?: string;
      required?: boolean;
      rows?: number;
    }
  | {
      name: string;
      label: string;
      kind: "select";
      options: Option[];
      required?: boolean;
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
  schema: z.ZodObject;
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
  ["To Do", "todo"],
  ["Doing", "doing"],
  ["Done", "done"],
  ["Deferred", "deferred"],
].map(([label, value]) => ({ label, value }));

const bugStatusOptions: Option[] = [
  ["Open", "open"],
  ["In Progress", "in_progress"],
  ["Ready to Retest", "ready_to_retest"],
  ["Closed", "closed"],
  ["Rejected", "rejected"],
].map(([label, value]) => ({ label, value }));

const testStatusOptions: Option[] = [
  ["Draft", "draft"],
  ["Active", "active"],
  ["Obsolete", "obsolete"],
].map(([label, value]) => ({ label, value }));

const taskCategoryOptions: Option[] = [
  ["Testing", "testing"],
  ["Follow-up", "follow-up"],
  ["Documentation", "documentation"],
  ["Investigation", "investigation"],
  ["Meeting Action", "meeting-action"],
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

const testTypeOptions: Option[] = [
  ["Positive", "positive"],
  ["Negative", "negative"],
].map(([label, value]) => ({ label, value }));

const apiMethodOptions: Option[] = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"].map(v => ({ label: v, value: v }));

const workloadStatusOptions: Option[] = [
  ["Available", "available"],
  ["Busy", "busy"],
  ["On Leave", "on_leave"]
].map(([label, value]) => ({ label, value }));

const taskSchema = z.object({
  title: requiredText("Title"),
  project: requiredText("Project"),
  relatedFeature: requiredText("Feature"),
  category: z.enum(["testing", "follow-up", "documentation", "investigation", "meeting-action"]),
  status: z.enum(["todo", "doing", "done", "deferred"]),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  dueDate: z.string().optional().default(""),
  description: requiredText("Description"),
  notes: optionalText,
  evidence: urlField,
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
  testSuiteId: requiredText("Test Suite ID"),
  tcId: requiredText("TC ID"),
  caseName: requiredText("Case Name"),
  typeCase: z.enum(["Positive", "Negative"]),
  preCondition: requiredText("Pre-condition"),
  testStep: requiredText("Test Step"),
  expectedResult: requiredText("Expected Result"),
  actualResult: optionalText,
  status: z.enum(["Pending", "Passed", "Failed", "Blocked"]),
});

const meetingSchema = z.object({
  date: z.string().min(1, "Date is required"),
  title: requiredText("Title"),
  project: requiredText("Project"),
  participants: requiredText("Participants"),
  summary: requiredText("Summary"),
  decisions: requiredText("Decisions"),
  actionItems: requiredText("Action Items"),
  notes: optionalText,
  evidence: urlField,
});

const dailyLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  project: requiredText("Project"),
  whatTested: requiredText("What Tested"),
  issuesFound: requiredText("Issues Found"),
  progressSummary: requiredText("Progress Summary"),
  blockers: optionalText,
  nextPlan: requiredText("Next Plan"),
  notes: optionalText,
  evidence: urlField,
});

const apiInventorySchema = z.object({
  title: requiredText("Title"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"]),
  endpoint: requiredText("Endpoint"),
  payload: optionalText,
  response: optionalText,
  notes: optionalText,
});

const workloadSchema = z.object({
  qaName: requiredText("QA Name"),
  project: requiredText("Project"),
  sprint: requiredText("Sprint"),
  tasks: requiredText("Focus Tasks"),
  status: z.enum(["available", "busy", "on_leave"]),
});

const performanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  title: requiredText("Test Name"),
  targetUrl: urlField,
  loadTime: z.string().optional().default(""),
  score: z.string().optional().default(""),
  notes: optionalText,
});

const envOptions: Option[] = ["Dev", "Staging", "UAT", "Production"].map(v => ({ label: v, value: v }));

const envConfigSchema = z.object({
  envName: z.enum(["Dev", "Staging", "UAT", "Production"]),
  label: requiredText("Label"),
  url: urlField,
  username: optionalText,
  password: optionalText,
  notes: optionalText,
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
  scope: requiredText("Scope"),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  assignee: optionalText,
  status: z.enum(["draft", "active", "closed"]),
  notes: optionalText,
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
  title: requiredText("Suite Title"),
  testPlanId: optionalText,
  notes: optionalText,
  status: z.enum(["draft", "active", "archived"]),
});

const sqlSnippetSchema = z.object({
  title: requiredText("Snippet Title"),
  project: requiredText("Project"),
  query: requiredText("SQL Query"),
  notes: optionalText,
});

const testingAssetSchema = z.object({
  title: requiredText("Asset Title"),
  project: requiredText("Project"),
  url: requiredText("Asset URL / Cloud Link"),
  type: z.enum(["apk", "ipa", "pdf", "csv", "img", "other"]),
  notes: optionalText,
});

function normalizeEntry(entry: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(entry).map(([key, value]) => [key, normalizeMultiline(value ?? "")]),
  );
}

export const moduleConfigs: Record<ModuleKey, ModuleConfig> = {
  tasks: {
    title: "Task Tracker",
    shortTitle: "Tasks",
    description: "Manage daily QA tasks, meeting follow-ups, and personal checklists.",
    prefix: "TASK",
    sheetName: "Tasks",
    schema: taskSchema,
    coerce: (entry) => {
      const clean = normalizeEntry(entry);
      return {
        ...clean,
        dueDate: clean.dueDate ? new Date(clean.dueDate) : null,
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
      "Due Date": item.dueDate ? new Date(String(item.dueDate)).toISOString().slice(0, 10) : "",
      Description: String(item.description),
      Notes: String(item.notes),
      Evidence: String(item.evidence),
    }),
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "project", label: "Project", kind: "text", required: true },
      { name: "relatedFeature", label: "Feature", kind: "text", required: true },
      { name: "category", label: "Category", kind: "select", options: taskCategoryOptions, required: true },
      { name: "status", label: "Status", kind: "select", options: taskStatusOptions, required: true },
      { name: "priority", label: "Priority", kind: "select", options: priorityOptions, required: true },
      { name: "dueDate", label: "Due Date", kind: "date" },
      { name: "description", label: "Description", kind: "textarea", rows: 4, required: true },
      { name: "relatedItems", label: "Linked Items", kind: "textarea", rows: 2 },
      { name: "notes", label: "Notes", kind: "textarea", rows: 3 },
      { name: "evidence", label: "Evidence", kind: "url" },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "title", label: "Title" },
      { key: "project", label: "Project" },
      { key: "relatedFeature", label: "Feature" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status", tone: "status" },
      { key: "priority", label: "Priority", tone: "priority" },
      { key: "dueDate", label: "Due Date" },
      { key: "description", label: "Description", multiline: true },
      { key: "relatedItems", label: "Linked Items", multiline: true },
      { key: "notes", label: "Notes", multiline: true },
      { key: "evidence", label: "Evidence", link: true },
    ],
  },
  bugs: {
    title: "Bug Register",
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
      { name: "project", label: "Project", kind: "text", required: true },
      { name: "module", label: "Module", kind: "text", required: true },
      { name: "bugType", label: "Bug Type", kind: "select", options: bugTypeOptions, required: true },
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "preconditions", label: "Preconditions", kind: "textarea", rows: 3, required: true },
      { name: "stepsToReproduce", label: "Steps to Reproduce", kind: "textarea", rows: 5, required: true },
      { name: "expectedResult", label: "Expected Result", kind: "textarea", rows: 4, required: true },
      { name: "actualResult", label: "Actual Result", kind: "textarea", rows: 4, required: true },
      { name: "severity", label: "Severity", kind: "select", options: severityOptions, required: true },
      { name: "priority", label: "Priority", kind: "select", options: priorityOptions, required: true },
      { name: "status", label: "Status", kind: "select", options: bugStatusOptions, required: true },
      { name: "suggestedDev", label: "Suggested Dev", kind: "text" },
      { name: "relatedItems", label: "Linked Items", kind: "textarea", rows: 2 },
      { name: "evidence", label: "Evidence", kind: "url" },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "project", label: "Project" },
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
      "Test Suite ID": String(item.testSuiteId),
      "TC ID": String(item.tcId),
      "Case Name": String(item.caseName),
      "Type Case": String(item.typeCase),
      "Pre-Condition": String(item.preCondition),
      "Test Step": String(item.testStep),
      "Expected Result": String(item.expectedResult),
      "Actual Result": String(item.actualResult ?? ""),
      Status: String(item.status),
    }),
    fields: [
      { name: "testSuiteId", label: "Test Suite ID", kind: "text", required: true },
      { name: "tcId", label: "TC ID", kind: "text", required: true },
      { name: "caseName", label: "Case Name", kind: "text", required: true },
      { name: "typeCase", label: "Type Case", kind: "select", options: [{ label: "Positive", value: "Positive" }, { label: "Negative", value: "Negative" }], required: true },
      { name: "preCondition", label: "Pre-condition", kind: "textarea", rows: 3, required: true },
      { name: "testStep", label: "Test Step", kind: "textarea", rows: 4, required: true },
      { name: "expectedResult", label: "Expected Result", kind: "textarea", rows: 3, required: true },
      { name: "actualResult", label: "Actual Result", kind: "textarea", rows: 3 },
      { name: "status", label: "Status", kind: "select", options: [{ label: "Pending", value: "Pending" }, { label: "Passed", value: "Passed" }, { label: "Failed", value: "Failed" }, { label: "Blocked", value: "Blocked" }], required: true },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "tcId", label: "TC ID" },
      { key: "caseName", label: "Case Name" },
      { key: "typeCase", label: "Type Case" },
      { key: "testSuiteId", label: "Test Suite ID" },
      { key: "status", label: "Status" },
    ],
  },
  "meeting-notes": {
    title: "Meeting Notes",
    shortTitle: "Meetings",
    description: "Capture meeting decisions, actions, and owners in one place.",
    prefix: "MTG",
    sheetName: "Meeting Notes",
    schema: meetingSchema,
    coerce: (entry) => {
      const clean = normalizeEntry(entry);
      return {
        ...clean,
        date: new Date(clean.date),
      };
    },
    toRow: (item) => ({
      ID: codeFromId("MTG", Number(item.id)),
      Date: new Date(String(item.date)).toISOString().slice(0, 10),
      Title: String(item.title),
      Project: String(item.project),
      Participants: String(item.participants),
      Summary: String(item.summary),
      Decisions: String(item.decisions),
      "Action Items": String(item.actionItems),
      Notes: String(item.notes),
      Evidence: String(item.evidence),
    }),
    fields: [
      { name: "date", label: "Date", kind: "date", required: true },
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "project", label: "Project", kind: "text", required: true },
      { name: "participants", label: "Participants", kind: "text", required: true },
      { name: "summary", label: "Summary", kind: "textarea", rows: 4, required: true },
      { name: "decisions", label: "Decisions", kind: "textarea", rows: 4, required: true },
      { name: "actionItems", label: "Action Items", kind: "textarea", rows: 5, required: true },
      { name: "notes", label: "Notes", kind: "textarea", rows: 3 },
      { name: "evidence", label: "Evidence", kind: "url" },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "date", label: "Date" },
      { key: "title", label: "Title" },
      { key: "project", label: "Project" },
      { key: "participants", label: "Participants" },
      { key: "summary", label: "Summary", multiline: true },
      { key: "decisions", label: "Decisions", multiline: true },
      { key: "actionItems", label: "Action Items", multiline: true },
      { key: "notes", label: "Notes", multiline: true },
      { key: "evidence", label: "Evidence", link: true },
    ],
  },
  "daily-logs": {
    title: "Daily Log",
    shortTitle: "Daily Log",
    description: "Daily testing summary, blockers, and next steps.",
    prefix: "LOG",
    sheetName: "Daily Log",
    schema: dailyLogSchema,
    coerce: (entry) => {
      const clean = normalizeEntry(entry);
      return {
        ...clean,
        date: new Date(clean.date),
      };
    },
    toRow: (item) => ({
      ID: codeFromId("LOG", Number(item.id)),
      Date: new Date(String(item.date)).toISOString().slice(0, 10),
      Project: String(item.project),
      "What Tested": String(item.whatTested),
      "Issues Found": String(item.issuesFound),
      "Progress Summary": String(item.progressSummary),
      Blockers: String(item.blockers),
      "Next Plan": String(item.nextPlan),
      Notes: String(item.notes),
      Evidence: String(item.evidence),
    }),
    fields: [
      { name: "date", label: "Date", kind: "date", required: true },
      { name: "project", label: "Project", kind: "text", required: true },
      { name: "whatTested", label: "What Tested", kind: "textarea", rows: 4, required: true },
      { name: "issuesFound", label: "Issues Found", kind: "textarea", rows: 4, required: true },
      { name: "progressSummary", label: "Progress Summary", kind: "textarea", rows: 4, required: true },
      { name: "blockers", label: "Blockers", kind: "textarea", rows: 3 },
      { name: "nextPlan", label: "Next Plan", kind: "textarea", rows: 3, required: true },
      { name: "notes", label: "Notes", kind: "textarea", rows: 3 },
      { name: "evidence", label: "Evidence", kind: "url" },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "date", label: "Date" },
      { key: "project", label: "Project" },
      { key: "whatTested", label: "What Tested", multiline: true },
      { key: "issuesFound", label: "Issues Found", multiline: true },
      { key: "progressSummary", label: "Progress Summary", multiline: true },
      { key: "blockers", label: "Blockers", multiline: true },
      { key: "nextPlan", label: "Next Plan", multiline: true },
      { key: "notes", label: "Notes", multiline: true },
      { key: "evidence", label: "Evidence", link: true },
    ],
  },
  "api-testing": {
    title: "API Testing Hub",
    shortTitle: "API Testing",
    description: "Store API requests, payloads, and response examples for testing and validation.",
    prefix: "API",
    sheetName: "API Testing",
    schema: apiInventorySchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("API", Number(item.id)),
      Title: String(item.title),
      Method: String(item.method),
      Endpoint: String(item.endpoint),
      Payload: String(item.payload),
      Response: String(item.response),
      Notes: String(item.notes),
    }),
    fields: [
      { name: "title", label: "API Name", kind: "text", placeholder: "e.g. User Login", required: true },
      { name: "method", label: "Method", kind: "select", options: apiMethodOptions, required: true },
      { name: "endpoint", label: "Endpoint / Path", kind: "text", placeholder: "e.g. /api/v1/auth/login", required: true },
      { name: "payload", label: "Request Payload (JSON)", kind: "textarea", rows: 6 },
      { name: "response", label: "Expected Response", kind: "textarea", rows: 6 },
      { name: "notes", label: "Authorization / Headers", kind: "textarea", rows: 3 },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "method", label: "Method" },
      { key: "title", label: "API Name" },
      { key: "endpoint", label: "Endpoint" },
      { key: "payload", label: "Payload", multiline: true },
      { key: "response", label: "Response", multiline: true },
      { key: "notes", label: "Notes", multiline: true },
    ],
  },
  workload: {
    title: "QA Workload Planner",
    shortTitle: "Workload",
    description: "Track team availability and assignments across projects and sprints.",
    prefix: "PLAN",
    sheetName: "Workload",
    schema: workloadSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("PLAN", Number(item.id)),
      "QA Name": String(item.qaName),
      Project: String(item.project),
      Sprint: String(item.sprint),
      "Focus Tasks": String(item.tasks),
      Status: String(item.status),
    }),
    fields: [
      { name: "qaName", label: "QA Name", kind: "text", required: true },
      { name: "project", label: "Project Assignment", kind: "text", required: true },
      { name: "sprint", label: "Current Sprint", kind: "text", required: true },
      { name: "tasks", label: "Focus Tasks", kind: "textarea", rows: 3, required: true },
      { name: "status", label: "Availability", kind: "select", options: workloadStatusOptions, required: true },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "qaName", label: "QA Name" },
      { key: "project", label: "Project" },
      { key: "sprint", label: "Sprint" },
      { key: "tasks", label: "Focus Tasks", multiline: true },
      { key: "status", label: "Availability", tone: "status" },
    ],
  },
  performance: {
    title: "Performance benchmark Log",
    shortTitle: "Performance",
    description: "Track application load times, Lighthouse scores, and API latency over time.",
    prefix: "PERF",
    sheetName: "Performance",
    schema: performanceSchema,
    coerce: (entry) => ({
      ...normalizeEntry(entry),
      date: new Date(entry.date),
    }),
    toRow: (item) => ({
      ID: codeFromId("PERF", Number(item.id)),
      Date: new Date(String(item.date)).toISOString().slice(0, 10),
      "Test Name": String(item.title),
      URL: String(item.targetUrl),
      "Load Time": String(item.loadTime),
      Score: String(item.score),
      Notes: String(item.notes),
    }),
    fields: [
      { name: "date", label: "Date", kind: "date", required: true },
      { name: "title", label: "Test Name", kind: "text", placeholder: "e.g. Homepage Smoke Test", required: true },
      { name: "targetUrl", label: "Target URL", kind: "url", required: true },
      { name: "loadTime", label: "Load Time (ms/sec)", kind: "text", placeholder: "e.g. 1.2s or 1200ms" },
      { name: "score", label: "Score (0-100)", kind: "text", placeholder: "e.g. 98" },
      { name: "notes", label: "Environment/Context", kind: "textarea", rows: 3 },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "date", label: "Date" },
      { key: "title", label: "Test Name" },
      { key: "targetUrl", label: "URL", link: true },
      { key: "loadTime", label: "Load Time" },
      { key: "score", label: "Score" },
    ],
  },
  "env-config": {
    title: "Environment Config Vault",
    shortTitle: "Env Config",
    description: "Store environment URLs, dummy credentials, and config notes for Dev, Staging, UAT, and Prod.",
    prefix: "ENV",
    sheetName: "Env Config",
    schema: envConfigSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("ENV", Number(item.id)),
      Environment: String(item.envName),
      Label: String(item.label),
      URL: String(item.url),
      Username: String(item.username),
      Notes: String(item.notes),
    }),
    fields: [
      { name: "envName", label: "Environment", kind: "select", options: envOptions, required: true },
      { name: "label", label: "Config Label", kind: "text", placeholder: "e.g. Admin Portal, API Gateway", required: true },
      { name: "url", label: "Base URL", kind: "url" },
      { name: "username", label: "Username / Email", kind: "text", placeholder: "e.g. admin@test.com" },
      { name: "password", label: "Password (Dummy Only)", kind: "text", placeholder: "e.g. Test@1234" },
      { name: "notes", label: "Notes / Headers / Token", kind: "textarea", rows: 3 },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "envName", label: "Environment" },
      { key: "label", label: "Label" },
      { key: "url", label: "URL", link: true },
      { key: "username", label: "Username" },
      { key: "notes", label: "Notes", multiline: true },
    ],
  },
  "test-plans": {
    title: "Test Plan",
    shortTitle: "Test Plans",
    description: "Top-level testing plan for a release or cycle.",
    prefix: "PLAN",
    sheetName: "Test Plans",
    schema: testPlanSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("PLAN", Number(item.id)),
      Code: String(item.code ?? ""),
      Title: String(item.title),
      Project: String(item.project),
      Sprint: String(item.sprint),
      Status: String(item.status),
      Assignee: String(item.assignee),
      "Start Date": String(item.startDate),
      "End Date": String(item.endDate),
      Scope: String(item.scope),
    }),
    fields: [
      { name: "title", label: "Plan Title", kind: "text", placeholder: "e.g. Sprint 12 Regression", required: true },
      { name: "project", label: "Project", kind: "text", required: true },
      { name: "sprint", label: "Sprint", kind: "text", placeholder: "e.g. Sprint 12", required: true },
      { name: "status", label: "Status", kind: "select", options: testPlanStatusOptions, required: true },
      { name: "startDate", label: "Start Date", kind: "date" },
      { name: "endDate", label: "End Date", kind: "date" },
      { name: "assignee", label: "Assignee", kind: "text", placeholder: "e.g. Wahyu, Rina" },
      { name: "scope", label: "Testing Scope", kind: "textarea", rows: 4, required: true },
      { name: "notes", label: "Notes / Exclusions", kind: "textarea", rows: 3 },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "title", label: "Plan Title" },
      { key: "status", label: "Status", tone: "status" },
      { key: "project", label: "Project" },
      { key: "sprint", label: "Sprint" },
      { key: "startDate", label: "Start" },
      { key: "endDate", label: "End" },
      { key: "assignee", label: "Assignee" },
    ],
  },
  "test-sessions": {
    title: "Test Execution Sessions",
    shortTitle: "Exec Sessions",
    description: "Record daily execution sessions, totals, and final outcome in one place.",
    prefix: "SES",
    sheetName: "Test Sessions",
    schema: testSessionSchema,
    coerce: (entry) => ({ ...normalizeEntry(entry), date: new Date(entry.date) }),
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
      { name: "project", label: "Project", kind: "text", required: true },
      { name: "sprint", label: "Sprint", kind: "text", required: true },
      { name: "tester", label: "Tester", kind: "text", required: true },
      { name: "scope", label: "Modules Tested", kind: "textarea", rows: 3, required: true },
      { name: "result", label: "Overall Result", kind: "select", options: sessionResultOptions, required: true },
      { name: "totalCases", label: "Total Cases", kind: "text", placeholder: "e.g. 45" },
      { name: "passed", label: "Passed", kind: "text", placeholder: "e.g. 40" },
      { name: "failed", label: "Failed", kind: "text", placeholder: "e.g. 3" },
      { name: "blocked", label: "Blocked", kind: "text", placeholder: "e.g. 2" },
      { name: "notes", label: "Notes / Issues", kind: "textarea", rows: 3 },
      { name: "evidence", label: "Evidence", kind: "url" },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "date", label: "Date" },
      { key: "project", label: "Project" },
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
    title: "Test Suite",
    shortTitle: "Suites",
    description: "Middle layer grouping test cases under a test plan.",
    prefix: "SUITE",
    sheetName: "Suites",
    schema: suiteSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("SUITE", Number(item.id)),
      "Test Plan ID": String(item.testPlanId ?? ""),
      Title: String(item.title),
      Status: String(item.status),
    }),
    fields: [
      { name: "testPlanId", label: "Test Plan ID", kind: "text", required: true },
      { name: "title", label: "Suite Title", kind: "text", placeholder: "e.g. Checkout Flow Regression", required: true },
      { name: "status", label: "Status", kind: "select", options: [
        { label: "Draft", value: "draft" },
        { label: "Active", value: "active" },
        { label: "Archived", value: "archived" },
      ], required: true },
      { name: "notes", label: "Goal / Notes", kind: "textarea", rows: 3 },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "title", label: "Suite Title" },
      { key: "testPlanId", label: "Test Plan ID" },
      { key: "status", label: "Status", tone: "status" },
    ],
  },
  "sql-snippets": {
    title: "SQL Query Library",
    shortTitle: "SQL Snippets",
    description: "Store your common SQL queries per project for quick data preparation.",
    prefix: "SQL",
    sheetName: "SQL",
    schema: sqlSnippetSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("SQL", Number(item.id)),
      Title: String(item.title),
      Project: String(item.project),
      Query: String(item.query),
    }),
    fields: [
      { name: "title", label: "Snippet Label", kind: "text", placeholder: "e.g. Reset User Password", required: true },
      { name: "project", label: "Project", kind: "text", required: true },
      { name: "query", label: "SQL Query", kind: "textarea", rows: 6, placeholder: "UPDATE users SET ...", required: true },
      { name: "notes", label: "Description / Usage Note", kind: "textarea", rows: 2 },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "title", label: "Label" },
      { key: "project", label: "Project" },
      { key: "query", label: "SQL Query", multiline: true },
    ],
  },
  "testing-assets": {
    title: "Testing Assets Repo",
    shortTitle: "Assets",
    description: "Store links to test APKs, dummy data PDFs, or CSV files for specific projects.",
    prefix: "ASSET",
    sheetName: "Assets",
    schema: testingAssetSchema,
    coerce: (entry) => normalizeEntry(entry),
    toRow: (item) => ({
      ID: codeFromId("ASSET", Number(item.id)),
      Title: String(item.title),
      Project: String(item.project),
      URL: String(item.url),
      Type: String(item.type),
    }),
    fields: [
      { name: "title", label: "Asset Name", kind: "text", placeholder: "e.g. Latest APK Staging", required: true },
      { name: "project", label: "Project", kind: "text", required: true },
      { name: "url", label: "Public URL / Cloud Link", kind: "text", placeholder: "https://gdrive.com/...", required: true },
      { name: "type", label: "Type", kind: "select", options: [
        { label: "APK (Android)", value: "apk" },
        { label: "IPA (iOS)", value: "ipa" },
        { label: "PDF Document", value: "pdf" },
        { label: "CSV / Excel Data", value: "csv" },
        { label: "Image / Asset", value: "img" },
        { label: "Other", value: "other" },
      ], required: true },
      { name: "notes", label: "Notes / Version Info", kind: "textarea", rows: 2 },
    ],
    columns: [
      { key: "code", label: "ID" },
      { key: "title", label: "Asset Name" },
      { key: "project", label: "Project" },
      { key: "type", label: "Type", tone: "status" },
      { key: "url", label: "Download Link", link: true },
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
  "api-testing",
  "env-config",
  "workload",
  "performance",
  "meeting-notes",
  "daily-logs",
];

export const moduleLabels = Object.fromEntries(
  moduleOrder.map((key) => [key, moduleConfigs[key].shortTitle]),
) as Record<ModuleKey, string>;

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
  return moduleConfigs[module].schema.parse(entry);
}

export function safeParseModuleEntry(module: ModuleKey, entry: Record<string, string>) {
  return moduleConfigs[module].schema.safeParse(entry);
}
