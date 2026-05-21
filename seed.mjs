// seed.mjs - run with: node seed.mjs
import { DatabaseSync } from "node:sqlite";
import { existsSync, unlinkSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, createHash } from "node:crypto";

const dbPaths = [join(process.cwd(), "prisma", "dev.db"), join(process.cwd(), "main.db")];
let dbReused = false;
for (const p of dbPaths) {
  if (!existsSync(p)) continue;
  try {
    unlinkSync(p);
    console.log("Deleted:", p);
  } catch (err) {
    if (String(err?.code || "") === "EBUSY") {
      if (p.endsWith("dev.db")) {
        console.log(`File locked, will drop & recreate tables instead: ${p}`);
        dbReused = true;
      }
      continue;
    }
    throw err;
  }
}

mkdirSync(join(process.cwd(), "prisma"), { recursive: true });
const DB_PATH = join(process.cwd(), "prisma", "dev.db");
const db = new DatabaseSync(DB_PATH);

if (dbReused) {
  const tables = ["WorkLog","DashboardFilter","PresenceHeartbeat","DashboardComment","CaseVerdict","ExecutionRun","ActivityLog","Invite","Deployment","MeetingNote","TestSession","TestCase","TestSuite","TestPlan","Bug","Task","Assignee","User","Sprint","SearchToken","Company","AdminAuditLog","Announcement","SupportTicket"];
  for (const t of tables) {
    try { db.exec(`DROP TABLE IF EXISTS "${t}"`); } catch {}
  }
  console.log("✓ Dropped existing tables");
}

function loadEnvFile(filePath = join(process.cwd(), ".env")) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}
function tok() { return randomBytes(16).toString("base64url"); }
function isoDate(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}
function isoTimestamp(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
}

db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");


// ─── Create Tables ───────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS "Sprint" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "name" TEXT NOT NULL,
  "startDate" TEXT,
  "endDate" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "goal" TEXT DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Task" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "sprintId" INTEGER REFERENCES "Sprint"(id),
  "title" TEXT NOT NULL,
  "project" TEXT NOT NULL,
  "relatedFeature" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TEXT,
  "startDate" TEXT,
  "endDate" TEXT,
  "description" TEXT NOT NULL,
  "acceptanceCriteria" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "evidence" TEXT NOT NULL DEFAULT '',
  "relatedItems" TEXT DEFAULT '',
  "assignee" TEXT DEFAULT '',
  "attachments" TEXT DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Bug" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "sprintId" INTEGER REFERENCES "Sprint"(id),
  "project" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "bugType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "preconditions" TEXT NOT NULL,
  "stepsToReproduce" TEXT NOT NULL,
  "expectedResult" TEXT NOT NULL,
  "actualResult" TEXT DEFAULT '',
  "severity" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "evidence" TEXT NOT NULL DEFAULT '',
  "relatedItems" TEXT DEFAULT '',
  "suggestedDev" TEXT DEFAULT '',
  "attachments" TEXT DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "TestCase" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "publicToken" TEXT NOT NULL DEFAULT '',
  "testSuiteId" TEXT NOT NULL DEFAULT '',
  "tcId" TEXT NOT NULL,
  "typeCase" TEXT NOT NULL,
  "preCondition" TEXT NOT NULL,
  "caseName" TEXT NOT NULL,
  "assignee" TEXT DEFAULT '',
  "testStep" TEXT NOT NULL,
  "expectedResult" TEXT NOT NULL,
  "actualResult" TEXT DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "automationResult" TEXT,
  "evidence" TEXT DEFAULT '',
  "priority" TEXT DEFAULT 'Medium',
  "lastRunAt" TEXT,
  "relatedItems" TEXT DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "TestPlan" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "publicToken" TEXT NOT NULL DEFAULT '',
  "title" TEXT NOT NULL,
  "project" TEXT NOT NULL,
  "sprint" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "startDate" TEXT,
  "endDate" TEXT,
  "assignee" TEXT,
  "notes" TEXT,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "TestSession" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "date" TEXT NOT NULL,
  "project" TEXT NOT NULL,
  "sprint" TEXT NOT NULL,
  "tester" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "totalCases" TEXT,
  "passed" TEXT,
  "failed" TEXT,
  "blocked" TEXT,
  "result" TEXT NOT NULL,
  "notes" TEXT,
  "evidence" TEXT,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "TestSuite" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "publicToken" TEXT NOT NULL DEFAULT '',
  "testPlanId" TEXT NOT NULL DEFAULT '',
  "title" TEXT NOT NULL,
  "assignee" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "notes" TEXT,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "actor" TEXT NOT NULL DEFAULT '',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "SearchToken" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "entityIdInt" INTEGER NOT NULL DEFAULT 0,
  "token" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "MeetingNote" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "publicToken" TEXT NOT NULL DEFAULT '',
  "date" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "project" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "attendees" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL DEFAULT '',
  "summary" TEXT NOT NULL DEFAULT '',
  "actionItems" TEXT NOT NULL DEFAULT '',
  "relatedItems" TEXT DEFAULT '',
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Assignee" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "userId" INTEGER UNIQUE,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "email" TEXT,
  "skills" TEXT DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'active',
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "User" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "name" TEXT,
  "email" TEXT UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'qa',
  "avatar" TEXT DEFAULT '',
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Invite" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "token" TEXT NOT NULL UNIQUE,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'qa',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdBy" TEXT NOT NULL DEFAULT '',
  "expiresAt" TEXT NOT NULL,
  "acceptedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Deployment" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "date" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "project" TEXT NOT NULL,
  "environment" TEXT NOT NULL DEFAULT 'staging',
  "developer" TEXT NOT NULL,
  "changelog" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'success',
  "notes" TEXT DEFAULT '',
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "ExecutionRun" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "testSuiteId" INTEGER NOT NULL,
  "testPlanId" TEXT NOT NULL DEFAULT '',
  "runNumber" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'in-progress',
  "tester" TEXT NOT NULL DEFAULT '',
  "totalCases" INTEGER NOT NULL DEFAULT 0,
  "passed" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "blocked" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT DEFAULT '',
  "startedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TEXT,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "CaseVerdict" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "executionRunId" INTEGER NOT NULL,
  "testCaseId" INTEGER NOT NULL,
  "verdict" TEXT NOT NULL DEFAULT 'Pending',
  "actualResult" TEXT DEFAULT '',
  "evidence" TEXT DEFAULT '',
  "duration" INTEGER NOT NULL DEFAULT 0,
  "executedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "DashboardComment" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "entityType" TEXT NOT NULL,
  "entityId" INTEGER NOT NULL,
  "authorId" INTEGER NOT NULL,
  "authorName" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "PresenceHeartbeat" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "userId" INTEGER NOT NULL,
  "userName" TEXT NOT NULL DEFAULT '',
  "lastSeen" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "DashboardFilter" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "userId" INTEGER NOT NULL,
  "userName" TEXT NOT NULL DEFAULT '',
  "name" TEXT NOT NULL,
  "project" TEXT NOT NULL DEFAULT '',
  "activityScope" TEXT NOT NULL DEFAULT 'team',
  "density" TEXT NOT NULL DEFAULT 'comfortable',
  "shared" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "WorkLog" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "date" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "project" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "output" TEXT DEFAULT '',
  "notes" TEXT DEFAULT '',
  "assignee" TEXT DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "_migrations" (
  "version" INTEGER NOT NULL,
  "appliedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Company" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL UNIQUE,
  "plan" TEXT NOT NULL DEFAULT 'free',
  "planExpiry" TEXT,
  "maxUsers" INTEGER NOT NULL DEFAULT 10,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "actor" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target" TEXT NOT NULL DEFAULT '',
  "detail" TEXT NOT NULL DEFAULT '',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Announcement" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "targetCompany" TEXT NOT NULL DEFAULT '',
  "active" INTEGER NOT NULL DEFAULT 1,
  "createdBy" TEXT NOT NULL DEFAULT '',
  "expiresAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'general',
  "status" TEXT NOT NULL DEFAULT 'open',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "createdBy" TEXT NOT NULL DEFAULT '',
  "adminReply" TEXT NOT NULL DEFAULT '',
  "repliedAt" TEXT,
  "closedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);
console.log("✓ Tables created");


// ─── Seed Data ───────────────────────────────────────────────────────────────
const COMPANY = "Akusara Project";
const COMPANY2 = "Nusantara Tech";
const PROJECT = "QA Daily Hub";
const PROJECT2 = "Mobile Banking App";

// ─── Companies ───────────────────────────────────────────────────────────────
const companies = [
  { name: COMPANY, plan: "pro", planExpiry: isoDate(60), maxUsers: 25, status: "active" },
  { name: COMPANY2, plan: "free", planExpiry: isoDate(5), maxUsers: 5, status: "active" },
];

for (const c of companies) {
  db.prepare('INSERT INTO "Company" ("name","plan","planExpiry","maxUsers","status") VALUES (?,?,?,?,?)').run(c.name, c.plan, c.planExpiry, c.maxUsers, c.status);
}
console.log(`✓ ${companies.length} companies created`);

// ─── Users ───────────────────────────────────────────────────────────────────
const adminPassword = hashPassword(process.env.SEED_ADMIN_PASSWORD || "Lotus1919!");
const userPassword = hashPassword("Password123!");
const superadminPassword = hashPassword(process.env.SEED_SUPERADMIN_PASSWORD || "SuperAdmin123!");

const users = [
  { name: "Super Admin", email: process.env.SEED_SUPERADMIN_EMAIL || "superadmin@qa-daily.local", password: superadminPassword, role: "superadmin", company: "" },
  { name: process.env.SEED_ADMIN_NAME || "Admin", email: process.env.SEED_ADMIN_EMAIL || "admin@qa-daily.local", password: adminPassword, role: "admin", company: COMPANY },
  { name: "Budi Santoso", email: "budi@akusara.dev", password: userPassword, role: "qa", company: COMPANY },
  { name: "Siti Rahayu", email: "siti@akusara.dev", password: userPassword, role: "qa", company: COMPANY },
  { name: "Andi Pratama", email: "andi@akusara.dev", password: userPassword, role: "fe", company: COMPANY },
  { name: "Dewi Lestari", email: "dewi@akusara.dev", password: userPassword, role: "be", company: COMPANY },
  { name: "Rizky Firmansyah", email: "rizky@akusara.dev", password: userPassword, role: "fullstack", company: COMPANY },
  { name: "Maya Putri", email: "maya@akusara.dev", password: userPassword, role: "pm", company: COMPANY },
  { name: "Fajar Nugroho", email: "fajar@akusara.dev", password: userPassword, role: "be", company: COMPANY },
  { name: "Nadia Kusuma", email: "nadia@akusara.dev", password: userPassword, role: "qa", company: COMPANY },
  { name: "Hendra Wijaya", email: "hendra@akusara.dev", password: userPassword, role: "fe", company: COMPANY },
];

for (const u of users) {
  db.prepare('INSERT INTO "User" ("name","email","password","role","company") VALUES (?,?,?,?,?)').run(u.name, u.email, u.password, u.role, u.company);
}
console.log(`✓ ${users.length} users created`);

// ─── Users for Company 2 (Nusantara Tech) ────────────────────────────────────
const users2 = [
  { name: "Arif Hidayat", email: "arif@nusantara.dev", password: userPassword, role: "admin", company: COMPANY2 },
  { name: "Putri Wulandari", email: "putri@nusantara.dev", password: userPassword, role: "qa", company: COMPANY2 },
  { name: "Dimas Prasetyo", email: "dimas@nusantara.dev", password: userPassword, role: "fe", company: COMPANY2 },
  { name: "Lina Marlina", email: "lina@nusantara.dev", password: userPassword, role: "be", company: COMPANY2 },
  { name: "Reza Gunawan", email: "reza@nusantara.dev", password: userPassword, role: "pm", company: COMPANY2 },
];

for (const u of users2) {
  db.prepare('INSERT INTO "User" ("name","email","password","role","company") VALUES (?,?,?,?,?)').run(u.name, u.email, u.password, u.role, u.company);
}
console.log(`✓ ${users2.length} users (Nusantara Tech) created`);

// ─── Assignees (synced from users) ──────────────────────────────────────────
const assignees = [
  { userId: 1, name: users[0].name, role: "Admin", email: users[0].email, skills: "Project Management, QA Strategy", status: "active" },
  { userId: 2, name: users[1].name, role: "QA Engineer", email: users[1].email, skills: "Manual Testing, API Testing, Selenium", status: "active" },
  { userId: 3, name: users[2].name, role: "QA Engineer", email: users[2].email, skills: "Mobile Testing, Performance Testing", status: "active" },
  { userId: 4, name: users[3].name, role: "Frontend Developer", email: users[3].email, skills: "React, Next.js, TypeScript", status: "active" },
  { userId: 5, name: users[4].name, role: "Backend Developer", email: users[4].email, skills: "Node.js, PostgreSQL, Redis", status: "active" },
  { userId: 6, name: users[5].name, role: "Fullstack Developer", email: users[5].email, skills: "React, Node.js, Docker", status: "active" },
  { userId: 7, name: users[6].name, role: "Project Manager", email: users[6].email, skills: "Agile, Scrum, Jira", status: "active" },
  { userId: 8, name: users[7].name, role: "Backend Developer", email: users[7].email, skills: "Go, Microservices, AWS", status: "active" },
  { userId: 9, name: users[8].name, role: "QA Engineer", email: users[8].email, skills: "Automation, Playwright, Cypress", status: "active" },
  { userId: 10, name: users[9].name, role: "Frontend Developer", email: users[9].email, skills: "Vue.js, Tailwind, Figma", status: "active" },
];

for (const a of assignees) {
  db.prepare('INSERT INTO "Assignee" ("company","userId","name","role","email","skills","status") VALUES (?,?,?,?,?,?,?)').run(COMPANY, a.userId, a.name, a.role, a.email, a.skills, a.status);
}
console.log(`✓ ${assignees.length} assignees created`);

// ─── Sprints ─────────────────────────────────────────────────────────────────
const sprints = [
  { name: "Sprint 1", startDate: isoDate(-60), endDate: isoDate(-46), status: "completed", goal: "Setup project foundation and authentication module" },
  { name: "Sprint 2", startDate: isoDate(-45), endDate: isoDate(-31), status: "completed", goal: "Implement core dashboard and reporting features" },
  { name: "Sprint 3", startDate: isoDate(-30), endDate: isoDate(-16), status: "completed", goal: "Test management module and bug tracking" },
  { name: "Sprint 4", startDate: isoDate(-15), endDate: isoDate(-1), status: "active", goal: "Performance optimization and mobile responsiveness" },
  { name: "Sprint 5", startDate: isoDate(0), endDate: isoDate(14), status: "active", goal: "Deployment pipeline and CI/CD integration" },
  { name: "Sprint 6", startDate: isoDate(15), endDate: isoDate(29), status: "planning", goal: "User analytics and notification system" },
  { name: "Sprint 7", startDate: isoDate(30), endDate: isoDate(44), status: "planning", goal: "API documentation and third-party integrations" },
  { name: "Sprint 8", startDate: isoDate(-90), endDate: isoDate(-76), status: "completed", goal: "Initial prototype and wireframes" },
  { name: "Sprint 9", startDate: isoDate(45), endDate: isoDate(59), status: "planning", goal: "Security audit and penetration testing" },
  { name: "Sprint 10", startDate: isoDate(60), endDate: isoDate(74), status: "planning", goal: "Final UAT and production release" },
];

for (let i = 0; i < sprints.length; i++) {
  const s = sprints[i];
  db.prepare('INSERT INTO "Sprint" ("company","name","startDate","endDate","status","goal","sortOrder") VALUES (?,?,?,?,?,?,?)').run(COMPANY, s.name, s.startDate, s.endDate, s.status, s.goal, i + 1);
}
console.log(`✓ ${sprints.length} sprints created`);

// ─── Test Plans ──────────────────────────────────────────────────────────────
const testPlans = [
  { title: "Sprint 4 Regression Test", project: PROJECT, sprint: "Sprint 4", scope: "Full regression on dashboard, auth, and reports", status: "active", startDate: isoDate(-15), endDate: isoDate(-1) },
  { title: "Sprint 5 Integration Test", project: PROJECT, sprint: "Sprint 5", scope: "CI/CD pipeline validation and deployment checks", status: "active", startDate: isoDate(0), endDate: isoDate(14) },
  { title: "Mobile App Smoke Test", project: PROJECT2, sprint: "Sprint 4", scope: "Core flows: login, transfer, balance check", status: "active", startDate: isoDate(-10), endDate: isoDate(4) },
  { title: "API Endpoint Validation", project: PROJECT, sprint: "Sprint 3", scope: "All REST endpoints response validation", status: "closed", startDate: isoDate(-30), endDate: isoDate(-16) },
  { title: "Performance Benchmark", project: PROJECT2, sprint: "Sprint 5", scope: "Load testing with 1000 concurrent users", status: "draft", startDate: isoDate(5), endDate: isoDate(14) },
  { title: "Security Penetration Test", project: PROJECT, sprint: "Sprint 6", scope: "OWASP Top 10 vulnerability assessment", status: "draft", startDate: isoDate(15), endDate: isoDate(29) },
  { title: "Sprint 3 UAT", project: PROJECT, sprint: "Sprint 3", scope: "User acceptance testing for test management module", status: "closed", startDate: isoDate(-28), endDate: isoDate(-18) },
  { title: "Cross-Browser Compatibility", project: PROJECT, sprint: "Sprint 4", scope: "Chrome, Firefox, Safari, Edge testing", status: "active", startDate: isoDate(-12), endDate: isoDate(-2) },
  { title: "Mobile Responsive Test", project: PROJECT2, sprint: "Sprint 4", scope: "Responsive layout on iOS and Android devices", status: "active", startDate: isoDate(-8), endDate: isoDate(2) },
  { title: "Data Migration Validation", project: PROJECT, sprint: "Sprint 2", scope: "Verify data integrity after SQLite to Postgres migration", status: "closed", startDate: isoDate(-45), endDate: isoDate(-35) },
];

for (let i = 0; i < testPlans.length; i++) {
  const tp = testPlans[i];
  db.prepare('INSERT INTO "TestPlan" ("company","publicToken","title","project","sprint","scope","status","startDate","endDate","assignee","notes") VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(
    COMPANY, tok(), tp.title, tp.project, tp.sprint, tp.scope, tp.status, tp.startDate, tp.endDate, assignees[i % assignees.length].name, ""
  );
}
console.log(`✓ ${testPlans.length} test plans created`);

// ─── Test Suites ─────────────────────────────────────────────────────────────
const testSuites = [
  { testPlanId: "1", title: "Login & Authentication Suite", assignee: "Budi Santoso", status: "active", notes: "Cover all auth flows including SSO" },
  { testPlanId: "1", title: "Dashboard Widgets Suite", assignee: "Siti Rahayu", status: "active", notes: "Verify all dashboard charts and metrics" },
  { testPlanId: "2", title: "CI/CD Pipeline Suite", assignee: "Nadia Kusuma", status: "draft", notes: "Validate build, test, deploy stages" },
  { testPlanId: "3", title: "Mobile Transfer Flow", assignee: "Siti Rahayu", status: "active", notes: "End-to-end transfer scenarios" },
  { testPlanId: "3", title: "Mobile Balance Check", assignee: "Budi Santoso", status: "active", notes: "Balance display and refresh" },
  { testPlanId: "4", title: "REST API CRUD Suite", assignee: "Nadia Kusuma", status: "archived", notes: "All CRUD operations on main endpoints" },
  { testPlanId: "5", title: "Load Test Scenarios", assignee: "Budi Santoso", status: "draft", notes: "K6 scripts for load testing" },
  { testPlanId: "8", title: "Cross-Browser Forms", assignee: "Siti Rahayu", status: "active", notes: "Form validation across browsers" },
  { testPlanId: "9", title: "Responsive Layout Suite", assignee: "Nadia Kusuma", status: "active", notes: "Breakpoint testing for all pages" },
  { testPlanId: "6", title: "OWASP Security Checks", assignee: "Budi Santoso", status: "draft", notes: "Automated security scanning" },
];

for (let i = 0; i < testSuites.length; i++) {
  const ts = testSuites[i];
  db.prepare('INSERT INTO "TestSuite" ("company","publicToken","testPlanId","title","assignee","status","notes") VALUES (?,?,?,?,?,?,?)').run(
    COMPANY, tok(), ts.testPlanId, ts.title, ts.assignee, ts.status, ts.notes
  );
}
console.log(`✓ ${testSuites.length} test suites created`);

// ─── Test Cases ──────────────────────────────────────────────────────────────
const testCases = [
  { testSuiteId: "1", tcId: "TC-001", caseName: "Valid Login with Email", typeCase: "Positive", preCondition: "User has valid credentials", testStep: "1. Open login page\n2. Enter valid email\n3. Enter valid password\n4. Click Login", expectedResult: "User redirected to dashboard", status: "Passed", priority: "Critical" },
  { testSuiteId: "1", tcId: "TC-002", caseName: "Login with Invalid Password", typeCase: "Negative", preCondition: "User exists in system", testStep: "1. Open login page\n2. Enter valid email\n3. Enter wrong password\n4. Click Login", expectedResult: "Error message: Invalid credentials", status: "Passed", priority: "High" },
  { testSuiteId: "1", tcId: "TC-003", caseName: "Login with Empty Fields", typeCase: "Negative", preCondition: "None", testStep: "1. Open login page\n2. Leave fields empty\n3. Click Login", expectedResult: "Validation errors shown for both fields", status: "Passed", priority: "Medium" },
  { testSuiteId: "2", tcId: "TC-004", caseName: "Dashboard Load Time", typeCase: "Positive", preCondition: "User is authenticated", testStep: "1. Navigate to dashboard\n2. Measure load time", expectedResult: "Dashboard loads within 2 seconds", status: "Failed", priority: "High" },
  { testSuiteId: "2", tcId: "TC-005", caseName: "Chart Data Accuracy", typeCase: "Positive", preCondition: "Test data exists in DB", testStep: "1. Open dashboard\n2. Compare chart values with DB query results", expectedResult: "Chart values match database records", status: "Passed", priority: "Critical" },
  { testSuiteId: "4", tcId: "TC-006", caseName: "Transfer to Valid Account", typeCase: "Positive", preCondition: "Sender has sufficient balance", testStep: "1. Open transfer page\n2. Enter valid recipient\n3. Enter amount\n4. Confirm transfer", expectedResult: "Transfer successful, balance updated", status: "Passed", priority: "Critical" },
  { testSuiteId: "4", tcId: "TC-007", caseName: "Transfer Exceeds Balance", typeCase: "Negative", preCondition: "Sender balance is 100", testStep: "1. Open transfer page\n2. Enter amount 500\n3. Confirm transfer", expectedResult: "Error: Insufficient balance", status: "Passed", priority: "High" },
  { testSuiteId: "5", tcId: "TC-008", caseName: "Balance Display After Login", typeCase: "Positive", preCondition: "User has active account", testStep: "1. Login to app\n2. Check balance widget", expectedResult: "Current balance displayed correctly", status: "Pending", priority: "Medium" },
  { testSuiteId: "8", tcId: "TC-009", caseName: "Form Submit on Firefox", typeCase: "Positive", preCondition: "Firefox browser installed", testStep: "1. Open form in Firefox\n2. Fill all fields\n3. Submit", expectedResult: "Form submits successfully without errors", status: "Blocked", priority: "Medium" },
  { testSuiteId: "9", tcId: "TC-010", caseName: "Mobile Menu Toggle", typeCase: "Positive", preCondition: "Screen width < 768px", testStep: "1. Open app on mobile viewport\n2. Tap hamburger menu\n3. Verify menu opens", expectedResult: "Navigation menu slides in from left", status: "Passed", priority: "High" },
];

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  db.prepare('INSERT INTO "TestCase" ("company","publicToken","testSuiteId","tcId","caseName","typeCase","preCondition","testStep","expectedResult","actualResult","status","priority","assignee","sortOrder") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    COMPANY, tok(), tc.testSuiteId, tc.tcId, tc.caseName, tc.typeCase, tc.preCondition, tc.testStep, tc.expectedResult, "", tc.status, tc.priority, assignees[(i + 1) % assignees.length].name, i + 1
  );
}
console.log(`✓ ${testCases.length} test cases created`);


// ─── Tasks ───────────────────────────────────────────────────────────────────
const tasks = [
  { title: "Implement dark mode toggle", project: PROJECT, relatedFeature: "UI Theme", category: "feature", status: "done", priority: "P1", description: "Add dark/light mode toggle in settings", acceptanceCriteria: "User can switch themes and preference persists", assignee: "Andi Pratama" },
  { title: "Fix pagination on test cases list", project: PROJECT, relatedFeature: "Test Cases", category: "bugfix", status: "doing", priority: "P0", description: "Pagination breaks when filtering by suite", acceptanceCriteria: "Pagination works correctly with all filters applied", assignee: "Rizky Firmansyah" },
  { title: "Add export to PDF for reports", project: PROJECT, relatedFeature: "Reports", category: "feature", status: "todo", priority: "P2", description: "Allow users to export dashboard reports as PDF", acceptanceCriteria: "PDF contains all visible charts and tables", assignee: "Hendra Wijaya" },
  { title: "Optimize dashboard query performance", project: PROJECT, relatedFeature: "Dashboard", category: "tech-debt", status: "review", priority: "P1", description: "Dashboard queries taking >3s on large datasets", acceptanceCriteria: "All dashboard queries complete within 500ms", assignee: "Dewi Lestari" },
  { title: "Research E2E testing framework", project: PROJECT, relatedFeature: "Testing", category: "research", status: "done", priority: "P2", description: "Evaluate Playwright vs Cypress for E2E tests", acceptanceCriteria: "Decision document with pros/cons comparison", assignee: "Nadia Kusuma" },
  { title: "Add real-time notifications", project: PROJECT, relatedFeature: "Notifications", category: "feature", status: "todo", priority: "P1", description: "Push notifications for bug assignments and status changes", acceptanceCriteria: "Users receive instant notifications on assignment", assignee: "Fajar Nugroho" },
  { title: "Refactor auth middleware", project: PROJECT, relatedFeature: "Authentication", category: "refactor", status: "doing", priority: "P1", description: "Current auth middleware is monolithic, split into composable functions", acceptanceCriteria: "Auth logic is modular and unit-testable", assignee: "Dewi Lestari" },
  { title: "Mobile app biometric login", project: PROJECT2, relatedFeature: "Login", category: "feature", status: "blocked", priority: "P0", description: "Implement fingerprint and face ID login for mobile app", acceptanceCriteria: "Biometric auth works on iOS 15+ and Android 12+", assignee: "Andi Pratama" },
  { title: "Setup staging environment", project: PROJECT2, relatedFeature: "Infrastructure", category: "support", status: "done", priority: "P1", description: "Configure staging server with production-like data", acceptanceCriteria: "Staging mirrors production config with sanitized data", assignee: "Rizky Firmansyah" },
  { title: "Write API documentation", project: PROJECT, relatedFeature: "Documentation", category: "enhancement", status: "doing", priority: "P2", description: "Document all public API endpoints with examples", acceptanceCriteria: "OpenAPI spec covers all endpoints with request/response examples", assignee: "Maya Putri" },
];

for (let i = 0; i < tasks.length; i++) {
  const t = tasks[i];
  db.prepare('INSERT INTO "Task" ("company","sprintId","title","project","relatedFeature","category","status","priority","startDate","endDate","description","acceptanceCriteria","assignee","sortOrder") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    COMPANY, (i % 5) + 1, t.title, t.project, t.relatedFeature, t.category, t.status, t.priority, isoDate(-20 + i * 2), isoDate(-10 + i * 2), t.description, t.acceptanceCriteria, t.assignee, i + 1
  );
}
console.log(`✓ ${tasks.length} tasks created`);

// ─── Bugs ────────────────────────────────────────────────────────────────────
const bugs = [
  { project: PROJECT, module: "Authentication", bugType: "Functional", title: "Session expires without warning", preconditions: "User is logged in for 6+ hours", stepsToReproduce: "1. Login\n2. Wait 6 hours\n3. Try to navigate", expectedResult: "Warning before session expires", actualResult: "Abrupt redirect to login page", severity: "high", priority: "P0", status: "open" },
  { project: PROJECT, module: "Dashboard", bugType: "UI/UX", title: "Chart tooltip overlaps sidebar", preconditions: "Dashboard with charts loaded", stepsToReproduce: "1. Hover over leftmost chart bar\n2. Observe tooltip position", expectedResult: "Tooltip stays within viewport", actualResult: "Tooltip hidden behind sidebar", severity: "medium", priority: "P2", status: "in_progress" },
  { project: PROJECT, module: "Test Cases", bugType: "Functional", title: "Duplicate test case IDs on import", preconditions: "CSV file with 50+ test cases", stepsToReproduce: "1. Import CSV with test cases\n2. Check generated IDs", expectedResult: "All IDs are unique", actualResult: "Some IDs are duplicated causing conflicts", severity: "critical", priority: "P0", status: "open" },
  { project: PROJECT2, module: "Transfer", bugType: "Validation", title: "Negative amount accepted in transfer", preconditions: "User on transfer page", stepsToReproduce: "1. Enter -100 as amount\n2. Submit transfer", expectedResult: "Validation error for negative amount", actualResult: "Transfer processes with negative value", severity: "critical", priority: "P0", status: "in_progress" },
  { project: PROJECT, module: "Reports", bugType: "Performance", title: "Report generation takes 30+ seconds", preconditions: "Database has 10k+ records", stepsToReproduce: "1. Navigate to Reports\n2. Select date range of 6 months\n3. Click Generate", expectedResult: "Report generates within 5 seconds", actualResult: "Loading spinner for 30+ seconds, sometimes timeout", severity: "high", priority: "P1", status: "open" },
  { project: PROJECT2, module: "Login", bugType: "Security", title: "Rate limiting not enforced on login", preconditions: "Login endpoint accessible", stepsToReproduce: "1. Send 100 login requests in 10 seconds\n2. Check if any are blocked", expectedResult: "Requests blocked after 5 failed attempts", actualResult: "All 100 requests processed without blocking", severity: "critical", priority: "P0", status: "ready_to_retest" },
  { project: PROJECT, module: "Notifications", bugType: "Functional", title: "Email notifications sent twice", preconditions: "User has email notifications enabled", stepsToReproduce: "1. Assign a bug to user\n2. Check user email inbox", expectedResult: "One notification email received", actualResult: "Two identical emails received", severity: "medium", priority: "P2", status: "closed" },
  { project: PROJECT, module: "Sprint Board", bugType: "UI/UX", title: "Drag and drop breaks on mobile", preconditions: "Mobile viewport (< 768px)", stepsToReproduce: "1. Open sprint board on mobile\n2. Try to drag a card", expectedResult: "Card moves smoothly to new column", actualResult: "Card snaps back to original position", severity: "medium", priority: "P1", status: "open" },
  { project: PROJECT2, module: "Balance", bugType: "API", title: "Balance API returns stale data", preconditions: "User just completed a transfer", stepsToReproduce: "1. Complete transfer\n2. Immediately call balance API", expectedResult: "Updated balance returned", actualResult: "Previous balance returned for ~5 seconds", severity: "high", priority: "P1", status: "in_progress" },
  { project: PROJECT, module: "Settings", bugType: "Compatibility", title: "Settings page broken on Safari 16", preconditions: "Safari 16 on macOS", stepsToReproduce: "1. Open Settings page in Safari 16\n2. Try to change any setting", expectedResult: "Settings save correctly", actualResult: "Save button unresponsive, console shows CSS grid error", severity: "low", priority: "P3", status: "open" },
];

for (let i = 0; i < bugs.length; i++) {
  const b = bugs[i];
  db.prepare('INSERT INTO "Bug" ("company","sprintId","project","module","bugType","title","preconditions","stepsToReproduce","expectedResult","actualResult","severity","priority","status","suggestedDev","sortOrder") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    COMPANY, (i % 5) + 1, b.project, b.module, b.bugType, b.title, b.preconditions, b.stepsToReproduce, b.expectedResult, b.actualResult, b.severity, b.priority, b.status, assignees[(i + 3) % assignees.length].name, i + 1
  );
}
console.log(`✓ ${bugs.length} bugs created`);

// ─── Test Sessions ───────────────────────────────────────────────────────────
const testSessions = [
  { date: isoDate(-14), project: PROJECT, sprint: "Sprint 4", tester: "Budi Santoso", scope: "Login, Dashboard, Settings", totalCases: "25", passed: "22", failed: "2", blocked: "1", result: "fail" },
  { date: isoDate(-13), project: PROJECT, sprint: "Sprint 4", tester: "Siti Rahayu", scope: "Reports, Export, Charts", totalCases: "18", passed: "16", failed: "1", blocked: "1", result: "fail" },
  { date: isoDate(-12), project: PROJECT2, sprint: "Sprint 4", tester: "Nadia Kusuma", scope: "Transfer, Balance, History", totalCases: "30", passed: "28", failed: "2", blocked: "0", result: "fail" },
  { date: isoDate(-10), project: PROJECT, sprint: "Sprint 4", tester: "Budi Santoso", scope: "Test Case CRUD, Import/Export", totalCases: "20", passed: "20", failed: "0", blocked: "0", result: "pass" },
  { date: isoDate(-8), project: PROJECT, sprint: "Sprint 4", tester: "Siti Rahayu", scope: "Sprint Board, Kanban, Drag-Drop", totalCases: "15", passed: "12", failed: "2", blocked: "1", result: "fail" },
  { date: isoDate(-6), project: PROJECT2, sprint: "Sprint 4", tester: "Nadia Kusuma", scope: "Login, Biometric, Session", totalCases: "22", passed: "20", failed: "1", blocked: "1", result: "fail" },
  { date: isoDate(-4), project: PROJECT, sprint: "Sprint 5", tester: "Budi Santoso", scope: "CI/CD Pipeline, Build Validation", totalCases: "12", passed: "12", failed: "0", blocked: "0", result: "pass" },
  { date: isoDate(-2), project: PROJECT, sprint: "Sprint 5", tester: "Siti Rahayu", scope: "Deployment Logs, Rollback", totalCases: "10", passed: "9", failed: "0", blocked: "1", result: "blocked" },
  { date: isoDate(-1), project: PROJECT2, sprint: "Sprint 5", tester: "Nadia Kusuma", scope: "Performance Load Test", totalCases: "8", passed: "5", failed: "3", blocked: "0", result: "fail" },
  { date: isoDate(0), project: PROJECT, sprint: "Sprint 5", tester: "Budi Santoso", scope: "Full Regression - All Modules", totalCases: "50", passed: "45", failed: "3", blocked: "2", result: "in_progress" },
];

for (const ts of testSessions) {
  db.prepare('INSERT INTO "TestSession" ("company","date","project","sprint","tester","scope","totalCases","passed","failed","blocked","result","notes") VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(
    COMPANY, ts.date, ts.project, ts.sprint, ts.tester, ts.scope, ts.totalCases, ts.passed, ts.failed, ts.blocked, ts.result, ""
  );
}
console.log(`✓ ${testSessions.length} test sessions created`);

// ─── Meeting Notes ───────────────────────────────────────────────────────────
const meetingNotes = [
  { date: isoDate(-14), project: PROJECT, title: "Sprint 4 Planning", attendees: "Admin, Budi, Siti, Maya", content: "Discussed sprint goals and task allocation. Focus on performance and mobile responsiveness.", actionItems: "Budi: setup performance benchmarks\nSiti: prepare mobile test devices" },
  { date: isoDate(-12), project: PROJECT, title: "Daily Standup", attendees: "Budi, Siti, Andi, Dewi", content: "Progress update on dashboard optimization. Dewi found N+1 query issue.", actionItems: "Dewi: fix N+1 queries by EOD\nAndi: review dark mode PR" },
  { date: isoDate(-10), project: PROJECT2, title: "Mobile App Review", attendees: "Admin, Siti, Nadia, Hendra", content: "Reviewed mobile transfer flow test results. 2 critical bugs found in validation.", actionItems: "Nadia: log bugs in tracker\nHendra: fix validation on frontend" },
  { date: isoDate(-8), project: PROJECT, title: "Bug Triage Meeting", attendees: "Admin, Maya, Budi, Dewi, Fajar", content: "Triaged 15 open bugs. Prioritized session expiry and duplicate ID issues as P0.", actionItems: "Fajar: fix session handling\nDewi: investigate duplicate IDs" },
  { date: isoDate(-6), project: PROJECT, title: "Sprint 4 Retrospective", attendees: "All team", content: "Good: improved test coverage. Bad: too many P0 bugs found late. Action: earlier smoke tests.", actionItems: "Maya: add smoke test checkpoint to sprint process\nBudi: automate critical path tests" },
  { date: isoDate(-4), project: PROJECT, title: "Sprint 5 Kickoff", attendees: "Admin, Maya, Rizky, Nadia", content: "Sprint 5 focus: CI/CD pipeline and deployment automation. Rizky leads infrastructure.", actionItems: "Rizky: setup GitHub Actions workflow\nNadia: prepare deployment test suite" },
  { date: isoDate(-3), project: PROJECT2, title: "Security Review", attendees: "Admin, Dewi, Fajar, Budi", content: "Reviewed rate limiting implementation. Found gaps in login and transfer endpoints.", actionItems: "Fajar: implement rate limiter middleware\nBudi: retest after fix" },
  { date: isoDate(-2), project: PROJECT, title: "Daily Standup", attendees: "Budi, Siti, Rizky, Nadia", content: "CI/CD pipeline working. Deployment logs feature in review. One blocker on rollback.", actionItems: "Rizky: fix rollback mechanism\nSiti: test deployment flow" },
  { date: isoDate(-1), project: PROJECT, title: "Demo Preparation", attendees: "Admin, Maya, Andi, Hendra", content: "Preparing demo for stakeholders. Dark mode and new dashboard ready. Need to fix chart tooltip.", actionItems: "Andi: fix tooltip overlap\nHendra: prepare demo script" },
  { date: isoDate(0), project: PROJECT, title: "Stakeholder Demo", attendees: "All team + Stakeholders", content: "Demonstrated Sprint 4-5 deliverables. Positive feedback on dashboard redesign. Request for PDF export.", actionItems: "Maya: add PDF export to Sprint 6 backlog\nAdmin: send meeting summary to stakeholders" },
];

for (const mn of meetingNotes) {
  db.prepare('INSERT INTO "MeetingNote" ("company","publicToken","date","project","title","attendees","content","actionItems","relatedItems") VALUES (?,?,?,?,?,?,?,?,?)').run(
    COMPANY, tok(), mn.date, mn.project, mn.title, mn.attendees, mn.content, mn.actionItems, ""
  );
}
console.log(`✓ ${meetingNotes.length} meeting notes created`);

// ─── Deployments ─────────────────────────────────────────────────────────────
const deployments = [
  { date: isoDate(-30), version: "v1.0.0", project: PROJECT, environment: "production", developer: "Rizky Firmansyah", changelog: "Initial release: auth, dashboard, basic CRUD", status: "success" },
  { date: isoDate(-25), version: "v1.1.0", project: PROJECT, environment: "staging", developer: "Dewi Lestari", changelog: "Added test plan management and sprint board", status: "success" },
  { date: isoDate(-20), version: "v1.1.0", project: PROJECT, environment: "production", developer: "Rizky Firmansyah", changelog: "Promoted staging v1.1.0 to production", status: "success" },
  { date: isoDate(-15), version: "v1.2.0-beta", project: PROJECT, environment: "staging", developer: "Andi Pratama", changelog: "Dark mode, responsive improvements, chart updates", status: "success" },
  { date: isoDate(-10), version: "v0.5.0", project: PROJECT2, environment: "development", developer: "Hendra Wijaya", changelog: "Mobile app: transfer flow, balance check", status: "success" },
  { date: isoDate(-8), version: "v1.2.0-beta.2", project: PROJECT, environment: "staging", developer: "Dewi Lestari", changelog: "Performance fixes: query optimization, caching", status: "failed" },
  { date: isoDate(-6), version: "v1.2.0-beta.3", project: PROJECT, environment: "staging", developer: "Dewi Lestari", changelog: "Fixed failed deployment: corrected migration script", status: "success" },
  { date: isoDate(-3), version: "v0.5.1", project: PROJECT2, environment: "staging", developer: "Fajar Nugroho", changelog: "Security: rate limiting, input validation fixes", status: "success" },
  { date: isoDate(-1), version: "v1.2.0", project: PROJECT, environment: "uat", developer: "Rizky Firmansyah", changelog: "UAT release: all Sprint 4 features included", status: "success" },
  { date: isoDate(0), version: "v1.2.0", project: PROJECT, environment: "production", developer: "Rizky Firmansyah", changelog: "Production release: dark mode, performance, responsive", status: "in_progress" },
];

for (const d of deployments) {
  db.prepare('INSERT INTO "Deployment" ("company","date","version","project","environment","developer","changelog","status","notes") VALUES (?,?,?,?,?,?,?,?,?)').run(
    COMPANY, d.date, d.version, d.project, d.environment, d.developer, d.changelog, d.status, ""
  );
}
console.log(`✓ ${deployments.length} deployments created`);

// ─── Work Logs ───────────────────────────────────────────────────────────────
const workLogs = [
  { date: isoDate(-5), startTime: "08:00", endTime: "12:00", category: "testing", project: PROJECT, description: "Executed regression test suite for Sprint 4", output: "25 test cases executed, 2 failures logged", assignee: "Budi Santoso" },
  { date: isoDate(-5), startTime: "13:00", endTime: "17:00", category: "bugfix", project: PROJECT, description: "Fixed N+1 query issue in dashboard API", output: "Query time reduced from 3s to 200ms", assignee: "Dewi Lestari" },
  { date: isoDate(-4), startTime: "09:00", endTime: "11:30", category: "code-review", project: PROJECT, description: "Reviewed dark mode PR and responsive layout changes", output: "Approved with minor comments on CSS variables", assignee: "Rizky Firmansyah" },
  { date: isoDate(-4), startTime: "13:00", endTime: "16:00", category: "development", project: PROJECT2, description: "Implemented rate limiting middleware for login endpoint", output: "Rate limiter active: 5 attempts per 15 minutes", assignee: "Fajar Nugroho" },
  { date: isoDate(-3), startTime: "08:30", endTime: "12:00", category: "testing", project: PROJECT2, description: "Security testing on transfer and login endpoints", output: "Rate limiting verified, 1 bypass found and reported", assignee: "Nadia Kusuma" },
  { date: isoDate(-3), startTime: "14:00", endTime: "17:30", category: "meeting", project: PROJECT, description: "Sprint 5 planning and task estimation session", output: "All Sprint 5 tasks estimated and assigned", assignee: "Maya Putri" },
  { date: isoDate(-2), startTime: "08:00", endTime: "12:00", category: "development", project: PROJECT, description: "Setup GitHub Actions CI/CD pipeline", output: "Pipeline runs: lint, test, build, deploy to staging", assignee: "Rizky Firmansyah" },
  { date: isoDate(-2), startTime: "13:00", endTime: "15:00", category: "documentation", project: PROJECT, description: "Wrote API documentation for auth endpoints", output: "OpenAPI spec for /auth/* endpoints completed", assignee: "Maya Putri" },
  { date: isoDate(-1), startTime: "09:00", endTime: "12:00", category: "testing", project: PROJECT, description: "Deployment validation testing on staging", output: "All smoke tests passed, ready for UAT", assignee: "Siti Rahayu" },
  { date: isoDate(0), startTime: "08:00", endTime: "10:00", category: "deployment", project: PROJECT, description: "Production deployment v1.2.0 with monitoring", output: "Deployment in progress, monitoring dashboards active", assignee: "Rizky Firmansyah" },
];

for (let i = 0; i < workLogs.length; i++) {
  const wl = workLogs[i];
  db.prepare('INSERT INTO "WorkLog" ("company","date","startTime","endTime","category","project","description","output","notes","assignee","sortOrder") VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(
    COMPANY, wl.date, wl.startTime, wl.endTime, wl.category, wl.project, wl.description, wl.output, "", wl.assignee, i + 1
  );
}
console.log(`✓ ${workLogs.length} work logs created`);

// ─── Activity Log ────────────────────────────────────────────────────────────
const activities = [
  { entityType: "tasks", entityId: "1", action: "created", summary: "Created task: Implement dark mode toggle", actor: "Admin" },
  { entityType: "tasks", entityId: "2", action: "created", summary: "Created task: Fix pagination on test cases list", actor: "Admin" },
  { entityType: "bugs", entityId: "1", action: "created", summary: "Reported bug: Session expires without warning", actor: "Budi Santoso" },
  { entityType: "bugs", entityId: "3", action: "created", summary: "Reported bug: Duplicate test case IDs on import", actor: "Nadia Kusuma" },
  { entityType: "test-plans", entityId: "1", action: "created", summary: "Created test plan: Sprint 4 Regression Test", actor: "Admin" },
  { entityType: "test-suites", entityId: "1", action: "created", summary: "Created suite: Login & Authentication Suite", actor: "Budi Santoso" },
  { entityType: "test-cases", entityId: "1", action: "created", summary: "Created test case: TC-001 Valid Login with Email", actor: "Budi Santoso" },
  { entityType: "deployments", entityId: "1", action: "created", summary: "Logged deployment: v1.0.0 to production", actor: "Rizky Firmansyah" },
  { entityType: "bugs", entityId: "4", action: "updated", summary: "Updated bug status: Negative amount accepted → In Progress", actor: "Dewi Lestari" },
  { entityType: "tasks", entityId: "1", action: "updated", summary: "Task completed: Implement dark mode toggle", actor: "Andi Pratama" },
];

for (const a of activities) {
  db.prepare('INSERT INTO "ActivityLog" ("company","entityType","entityId","action","summary","actor") VALUES (?,?,?,?,?,?)').run(
    COMPANY, a.entityType, a.entityId, a.action, a.summary, a.actor
  );
}
console.log(`✓ ${activities.length} activity logs created`);

// ─── Migration version ───────────────────────────────────────────────────────
db.prepare('INSERT INTO "_migrations" ("version") VALUES (?)').run(3);

console.log("\n✅ Seed complete! Database ready at:", DB_PATH);
console.log(`   Company: "${COMPANY}"`);
console.log(`   Admin login: ${users[0].email} / ${process.env.SEED_ADMIN_PASSWORD || "Lotus1919!"}`);
db.close();
