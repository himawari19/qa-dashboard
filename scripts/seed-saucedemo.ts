import { db } from "../lib/db";
import { createModuleRecord, logActivity } from "../lib/data";

const tables = [
  "ActivityLog",
  "Task",
  "Bug",
  "TestCaseScenario",
  "TestCase",
  "MeetingNote",
  "DailyLog",
  "ApiEndpoint",
  "WorkloadAssignment",
  "PerformanceBenchmark",
  "EnvConfig",
  "TestPlan",
  "TestSession",
  "TestSuite",
  "SqlSnippet",
  "TestingAsset",
  "Sprint",
];

async function resetAll() {
  for (const table of tables) {
    await db.run(`DELETE FROM "${table}"`);
  }
}

async function insertScenario(entry: {
  id: string;
  projectName: string;
  moduleName: string;
  referenceDocument: string;
  traceability: string;
  createdBy: string;
  relatedItems: string;
}) {
  await db.run(
    `INSERT INTO "TestCaseScenario" (id, projectName, moduleName, referenceDocument, traceability, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [entry.id, entry.projectName, entry.moduleName, entry.referenceDocument, entry.traceability, entry.createdBy],
  );
  await db.run(
    `INSERT INTO "ActivityLog" (entityType, entityId, action, summary) VALUES (?, ?, ?, ?)`,
    ["TestCaseScenario", entry.id, "create", `Created scenario ${entry.moduleName}`],
  );
}

async function insertMeeting(entry: {
  date: string;
  title: string;
  project: string;
  participants: string;
  summary: string;
  decisions: string;
  actionItems: string;
  notes: string;
  evidence: string;
}) {
  await db.run(
    `INSERT INTO "MeetingNote" (date, title, project, participants, summary, decisions, actionItems, notes, evidence, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [entry.date, entry.title, entry.project, entry.participants, entry.summary, entry.decisions, entry.actionItems, entry.notes, entry.evidence],
  );
}

async function insertDailyLog(entry: {
  date: string;
  project: string;
  whatTested: string;
  issuesFound: string;
  progressSummary: string;
  blockers: string;
  nextPlan: string;
  notes: string;
  evidence: string;
}) {
  await db.run(
    `INSERT INTO "DailyLog" (date, project, whatTested, issuesFound, progressSummary, blockers, nextPlan, notes, evidence, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [entry.date, entry.project, entry.whatTested, entry.issuesFound, entry.progressSummary, entry.blockers, entry.nextPlan, entry.notes, entry.evidence],
  );
}

async function seed() {
  await resetAll();

  const today = new Date();
  const d = (daysAgo: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().slice(0, 10);
  };

  await db.run(
    `INSERT INTO "Sprint" (name, startDate, endDate, status) VALUES (?, ?, ?, ?)`,
    ["SauceDemo Sprint 12", d(14), d(-7), "active"],
  );

  await createModuleRecord("tasks", {
    sprintId: 1,
    title: "Validate login and inventory flow",
    project: "SauceDemo",
    relatedFeature: "Authentication",
    category: "Smoke",
    status: "done",
    priority: "P1",
    dueDate: d(1),
    description: "Check standard_user login, inventory page load, and logout behavior.",
    notes: "Real-case smoke for saucedemo.com.",
    evidence: "https://www.saucedemo.com/",
    relatedItems: "BUG-001, TC-001",
  });
  await createModuleRecord("tasks", {
    sprintId: 1,
    title: "Verify cart and checkout on SauceDemo",
    project: "SauceDemo",
    relatedFeature: "Checkout",
    category: "Regression",
    status: "doing",
    priority: "P0",
    dueDate: d(0),
    description: "Add items to cart, remove item, checkout, and confirm order summary.",
    notes: "Focus on happy path and empty cart edge case.",
    evidence: "https://www.saucedemo.com/",
    relatedItems: "BUG-002, BUG-003",
  });
  await createModuleRecord("tasks", {
    sprintId: 1,
    title: "Audit product sort and image loading",
    project: "SauceDemo",
    relatedFeature: "Catalog",
    category: "Regression",
    status: "todo",
    priority: "P2",
    dueDate: d(-1),
    description: "Validate A-Z / Z-A sort, price sort, and product image rendering.",
    notes: "Useful for reports and RTM coverage.",
    evidence: "https://www.saucedemo.com/",
    relatedItems: "TC-003, BUG-004",
  });

  await createModuleRecord("bugs", {
    sprintId: 1,
    project: "SauceDemo",
    module: "Login",
    bugType: "Functional",
    title: "Locked out user shows error message but still allows navigation attempt",
    preconditions: "User has locked_out_user credentials.",
    stepsToReproduce: "1. Open saucedemo.com\n2. Login with locked_out_user\n3. Observe error and click browser back",
    expectedResult: "User stays on login screen with clear error state.",
    actualResult: "Error is shown but navigation state is not clearly blocked.",
    severity: "medium",
    priority: "P1",
    status: "open",
    evidence: "https://www.saucedemo.com/",
    relatedItems: "TC-001",
    suggestedDev: "Frontend QA",
  });
  await createModuleRecord("bugs", {
    sprintId: 1,
    project: "SauceDemo",
    module: "Cart",
    bugType: "Functional",
    title: "Remove button can leave stale cart badge after rapid clicks",
    preconditions: "User already added Sauce Labs Backpack to cart.",
    stepsToReproduce: "1. Add product to cart\n2. Open cart\n3. Remove item rapidly twice",
    expectedResult: "Cart badge and item count should stay in sync.",
    actualResult: "Badge may lag behind item removal during rapid clicks.",
    severity: "high",
    priority: "P0",
    status: "in_progress",
    evidence: "https://www.saucedemo.com/",
    relatedItems: "TASK-002",
    suggestedDev: "Frontend QA",
  });
  await createModuleRecord("bugs", {
    sprintId: 1,
    project: "SauceDemo",
    module: "Inventory",
    bugType: "UI/UX",
    title: "Product sort dropdown selection is not obvious on mobile",
    preconditions: "User logged in on small screen viewport.",
    stepsToReproduce: "1. Open inventory page\n2. Use sort dropdown\n3. Observe selected sort value",
    expectedResult: "Selected sort option should be clearly visible.",
    actualResult: "Selected option is easy to miss on narrow viewports.",
    severity: "low",
    priority: "P2",
    status: "ready_to_retest",
    evidence: "https://www.saucedemo.com/",
    relatedItems: "TASK-003",
    suggestedDev: "Frontend QA",
  });
  await createModuleRecord("bugs", {
    sprintId: 1,
    project: "SauceDemo",
    module: "Checkout",
    bugType: "Validation",
    title: "Checkout form should block empty first and last name",
    preconditions: "User is in checkout step one.",
    stepsToReproduce: "1. Add item to cart\n2. Proceed to checkout\n3. Leave first and last name empty\n4. Continue",
    expectedResult: "Inline validation prevents continuing.",
    actualResult: "Form relies on browser default feedback only.",
    severity: "medium",
    priority: "P1",
    status: "open",
    evidence: "https://www.saucedemo.com/",
    relatedItems: "TC-004",
    suggestedDev: "Frontend QA",
  });

  await insertScenario({
    id: "SAUCE-001",
    projectName: "SauceDemo",
    moduleName: "Login / Inventory",
    referenceDocument: "https://www.saucedemo.com/",
    traceability: "REQ-LOGIN-01, REQ-INV-01",
    createdBy: "QA Automation",
    relatedItems: "BUG-001, TASK-001",
  });
  await insertScenario({
    id: "SAUCE-002",
    projectName: "SauceDemo",
    moduleName: "Cart / Checkout",
    referenceDocument: "https://www.saucedemo.com/",
    traceability: "REQ-CART-01, REQ-CHK-01",
    createdBy: "QA Automation",
    relatedItems: "BUG-002, BUG-003",
  });
  await insertScenario({
    id: "SAUCE-003",
    projectName: "SauceDemo",
    moduleName: "Sorting / Images",
    referenceDocument: "https://www.saucedemo.com/",
    traceability: "REQ-INV-02, REQ-IMG-01",
    createdBy: "QA Automation",
    relatedItems: "BUG-004, TASK-003",
  });
  await insertScenario({
    id: "SAUCE-004",
    projectName: "SauceDemo",
    moduleName: "Checkout Validation",
    referenceDocument: "https://www.saucedemo.com/",
    traceability: "REQ-CHK-02",
    createdBy: "QA Automation",
    relatedItems: "BUG-005",
  });

  await insertMeeting({
    date: d(1),
    title: "SauceDemo smoke review",
    project: "SauceDemo",
    participants: "QA Lead, Automation Engineer, Product Owner",
    summary: "Reviewed login, inventory, cart, and checkout flows on saucedemo.com.",
    decisions: "Prioritize cart badge sync and checkout summary validation.",
    actionItems: "Update regression list\nAdd cart badge check\nRetest locked out user flow",
    notes: "Use standard_user for happy path and locked_out_user for negative case.",
    evidence: "https://www.saucedemo.com/",
  });
  await insertMeeting({
    date: d(0),
    title: "SauceDemo defect triage",
    project: "SauceDemo",
    participants: "QA Lead, Frontend QA, Product Owner",
    summary: "Reviewed three open issues from login, inventory, and checkout validation.",
    decisions: "Keep P0 checkout issue first; retest mobile inventory sorting next.",
    actionItems: "Prepare bug screenshots\nUpdate RTM\nSchedule retest",
    notes: "Used for executive summary data.",
    evidence: "https://www.saucedemo.com/",
  });

  await insertDailyLog({
    date: d(0),
    project: "SauceDemo",
    whatTested: "Login, inventory list, sort order, add-to-cart, checkout",
    issuesFound: "Cart badge lag on rapid remove and inconsistent error handling for locked out user.",
    progressSummary: "Smoke flow is stable on happy path; edge cases need follow-up.",
    blockers: "None",
    nextPlan: "Retest checkout and create detailed bug report screenshots.",
    notes: "Seeded from SauceDemo real-case sample.",
    evidence: "https://www.saucedemo.com/",
  });
  await insertDailyLog({
    date: d(1),
    project: "SauceDemo",
    whatTested: "Product sort, inventory images, checkout validation",
    issuesFound: "Mobile sort visibility and empty checkout field validation gap.",
    progressSummary: "Extended regression coverage beyond happy path.",
    blockers: "None",
    nextPlan: "Retest after UI polish and validation update.",
    notes: "Added to support daily log visuals.",
    evidence: "https://www.saucedemo.com/",
  });

  await createModuleRecord("api-testing", {
    title: "SauceDemo product catalog API",
    method: "GET",
    endpoint: "https://www.saucedemo.com/",
    payload: "n/a",
    response: "Inventory page data for products and prices.",
    notes: "Reference endpoint used by UI smoke checks.",
  });
  await createModuleRecord("api-testing", {
    title: "SauceDemo cart session endpoint",
    method: "GET",
    endpoint: "https://www.saucedemo.com/cart.html",
    payload: "n/a",
    response: "Cart contents for logged-in session.",
    notes: "Used for checkout validation reference.",
  });

  await createModuleRecord("workload", {
    qaName: "QA Automation",
    project: "SauceDemo",
    sprint: "Sprint 12",
    tasks: "Smoke login, cart, checkout, reports verification",
    status: "busy",
  });
  await createModuleRecord("workload", {
    qaName: "Frontend QA",
    project: "SauceDemo",
    sprint: "Sprint 12",
    tasks: "Mobile inventory sort, error state checks, RTM mapping",
    status: "available",
  });

  await createModuleRecord("performance", {
    date: d(0),
    title: "SauceDemo homepage smoke",
    targetUrl: "https://www.saucedemo.com/",
    loadTime: "1.2s",
    score: "98",
    notes: "Used for local demo performance comparison.",
  });
  await createModuleRecord("performance", {
    date: d(1),
    title: "SauceDemo cart page smoke",
    targetUrl: "https://www.saucedemo.com/cart.html",
    loadTime: "1.4s",
    score: "95",
    notes: "Checkout step performance baseline.",
  });

  await createModuleRecord("env-config", {
    envName: "Dev",
    label: "SauceDemo Public Demo",
    url: "https://www.saucedemo.com/",
    username: "standard_user",
    password: "secret_sauce",
    notes: "Login is public sample data from SauceDemo.",
  });
  await createModuleRecord("env-config", {
    envName: "Staging",
    label: "SauceDemo Locked User",
    url: "https://www.saucedemo.com/",
    username: "locked_out_user",
    password: "secret_sauce",
    notes: "Negative login scenario for local testing.",
  });
  await createModuleRecord("env-config", {
    envName: "UAT",
    label: "Locked Out Sample",
    url: "https://www.saucedemo.com/",
    username: "locked_out_user",
    password: "secret_sauce",
    notes: "Used to validate error states.",
  });

  await createModuleRecord("test-plans", {
    title: "SauceDemo Regression Plan",
    project: "SauceDemo",
    sprint: "Sprint 12",
    scope: "Login, inventory, cart, checkout, order confirmation, logout",
    startDate: d(2),
    endDate: d(-3),
    assignee: "QA Automation",
    status: "active",
    notes: "Real-case plan from saucedemo.com flows.",
  });
  await createModuleRecord("test-plans", {
    title: "SauceDemo Negative Flow Plan",
    project: "SauceDemo",
    sprint: "Sprint 12",
    scope: "Locked user login, empty cart checkout, field validation, mobile sort visibility",
    startDate: d(1),
    endDate: d(0),
    assignee: "Frontend QA",
    status: "draft",
    notes: "Covers failure and edge paths for reports.",
  });

  await createModuleRecord("test-sessions", {
    date: d(0),
    project: "SauceDemo",
    sprint: "Sprint 12",
    tester: "QA Automation",
    scope: "Login, sort, cart, checkout, logout",
    totalCases: "12",
    passed: "10",
    failed: "2",
    blocked: "0",
    result: "fail",
    notes: "Two UI issues need retest.",
    evidence: "https://www.saucedemo.com/",
  });
  await createModuleRecord("test-sessions", {
    date: d(1),
    project: "SauceDemo",
    sprint: "Sprint 12",
    tester: "Frontend QA",
    scope: "Inventory sort and checkout validation",
    totalCases: "8",
    passed: "7",
    failed: "1",
    blocked: "0",
    result: "pass",
    notes: "Mostly green with one validation issue.",
    evidence: "https://www.saucedemo.com/",
  });

  await createModuleRecord("test-suites", {
    title: "SauceDemo Smoke Suite",
    project: "SauceDemo",
    caseIds: "TC-1\nTC-2",
    status: "active",
    notes: "Happy path smoke coverage.",
  });
  await createModuleRecord("test-suites", {
    title: "SauceDemo Regression Suite",
    project: "SauceDemo",
    caseIds: "TC-1\nTC-2\nTC-3\nTC-4",
    status: "active",
    notes: "Covers happy and negative paths.",
  });

  await createModuleRecord("sql-snippets", {
    title: "SauceDemo order lookup",
    project: "SauceDemo",
    query: "SELECT * FROM orders WHERE customer = 'standard_user';",
    notes: "Demo SQL used for QA learning.",
  });
  await createModuleRecord("sql-snippets", {
    title: "SauceDemo defect count",
    project: "SauceDemo",
    query: "SELECT status, COUNT(*) FROM bugs GROUP BY status;",
    notes: "Used to show summary counts in demo.",
  });

  await createModuleRecord("testing-assets", {
    title: "SauceDemo checkout mock",
    project: "SauceDemo",
    url: "https://www.saucedemo.com/",
    type: "other",
    notes: "Reference asset for local demo flows.",
  });
  await createModuleRecord("testing-assets", {
    title: "SauceDemo screenshot pack",
    project: "SauceDemo",
    url: "https://www.saucedemo.com/",
    type: "img",
    notes: "Placeholder for captured screenshots and evidence.",
  });

  await logActivity("SauceDemo", "local-seed", "create", "Seeded local demo data from SauceDemo real-case flows.");

  console.log("SauceDemo local seed complete.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
