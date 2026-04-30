// seed.mjs — run with: node seed.mjs
import { DatabaseSync } from "node:sqlite";
import { existsSync, unlinkSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const dbPaths = [join(process.cwd(), "prisma", "dev.db"), join(process.cwd(), "main.db")];
for (const p of dbPaths) { if (existsSync(p)) { unlinkSync(p); console.log("Deleted:", p); } }

mkdirSync(join(process.cwd(), "prisma"), { recursive: true });
const DB_PATH = join(process.cwd(), "prisma", "dev.db");
const db = new DatabaseSync(DB_PATH);

async function hashPassword(password) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function tok() { return randomBytes(16).toString("base64url"); }

db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

db.exec(`CREATE TABLE IF NOT EXISTS "Sprint" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "name" TEXT NOT NULL,
  "startDate" TEXT,
  "endDate" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "goal" TEXT DEFAULT '',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "Task" (
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
  "description" TEXT NOT NULL,
  "notes" TEXT NOT NULL DEFAULT '',
  "evidence" TEXT NOT NULL DEFAULT '',
  "relatedItems" TEXT DEFAULT '',
  "assignee" TEXT DEFAULT '',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "Bug" (
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
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "TestCase" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "publicToken" TEXT NOT NULL DEFAULT '',
  "testSuiteId" TEXT NOT NULL DEFAULT '',
  "tcId" TEXT NOT NULL,
  "typeCase" TEXT NOT NULL,
  "preCondition" TEXT NOT NULL,
  "caseName" TEXT NOT NULL,
  "testStep" TEXT NOT NULL,
  "expectedResult" TEXT NOT NULL,
  "actualResult" TEXT DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "automationResult" TEXT,
  "evidence" TEXT DEFAULT '',
  "priority" TEXT DEFAULT 'Medium',
  "lastRunAt" TEXT,
  "relatedItems" TEXT DEFAULT '',
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "TestPlan" (
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
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "TestSession" (
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
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "TestSuite" (
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
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "MeetingNote" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "publicToken" TEXT NOT NULL DEFAULT '',
  "date" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "project" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "attendees" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL DEFAULT '',
  "actionItems" TEXT NOT NULL DEFAULT '',
  "deletedAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "Assignee" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "name" TEXT NOT NULL,
  "role" TEXT,
  "email" TEXT,
  "skills" TEXT DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS "User" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "company" TEXT NOT NULL DEFAULT '',
  "name" TEXT,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const C = "";

// ── SPRINTS ────────────────────────────────────────────────────
const iSprint = db.prepare(`INSERT INTO "Sprint" ("company","name","startDate","endDate","status","goal") VALUES (?,?,?,?,?,?)`);
iSprint.run(C,"Sprint 1: Onboarding & Auth","2026-01-01","2026-01-14","completed","Complete user registration, login, and profile setup flows.");
iSprint.run(C,"Sprint 2: Product Catalog","2026-01-15","2026-01-28","completed","Implement product listing, search, filter, and detail pages.");
iSprint.run(C,"Sprint 3: Checkout & Payment","2026-03-01","2026-03-14","active","Complete checkout funnel, payment integration, and promo codes.");
iSprint.run(C,"Sprint 4: Order Management","2026-03-15","2026-03-28","planning","Build order history, status tracking, and notification system.");
console.log("✓ Sprints (4)");

// ── ASSIGNEES ──────────────────────────────────────────────────
const iAsg = db.prepare(`INSERT INTO "Assignee" ("company","name","role","email","skills","status") VALUES (?,?,?,?,?,?)`);
iAsg.run(C,"Wahyu Simbolon","QA Lead","wahyu@ecoshop.id","Test Planning, Bug Triage, Automation","active");
iAsg.run(C,"Andi Pratama","QA Engineer","andi@ecoshop.id","Manual Testing, Regression, API Testing","active");
iAsg.run(C,"Dewi Kusuma","QA Engineer","dewi@ecoshop.id","UI Testing, Accessibility, Mobile","active");
iAsg.run(C,"Budi Santoso","QA Analyst","budi@ecoshop.id","Test Documentation, Test Cases","active");
iAsg.run(C,"Citra Lestari","Senior QA","citra@ecoshop.id","Automation, Performance, Security","active");
iAsg.run(C,"Eko Wijaya","QA Engineer","eko@ecoshop.id","Backend Testing, DB Validation","active");
console.log("✓ Assignees (6)");

// ── TASKS (22) ────────────────────────────────────────────────
const iTask = db.prepare(`INSERT INTO "Task" ("company","sprintId","title","project","relatedFeature","category","status","priority","dueDate","description","notes","assignee") VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
const tasks = [
  [C,3,"Verify checkout flow end-to-end","EcoShop Web","Checkout","testing","todo","P1","2026-03-05","Test the complete checkout funnel from cart to order confirmation.","Include edge cases for empty cart and session timeout.","Andi Pratama"],
  [C,3,"Test payment gateway integration","EcoShop Web","Payment","testing","doing","P1","2026-03-06","Validate Midtrans and DANA payment methods in staging.","Use sandbox credentials from .env.staging.","Wahyu Simbolon"],
  [C,3,"Regression test after cart hotfix","EcoShop Web","Cart","testing","done","P1","2026-03-04","Run full regression on cart module after BUG-003 fix.","All 18 test cases passed.","Dewi Kusuma"],
  [C,3,"Review test cases for promo code","EcoShop Web","Promo","documentation","todo","P2","2026-03-07","Audit and update TC library for discount code scenarios.","","Budi Santoso"],
  [C,3,"Exploratory test — mobile checkout","EcoShop Web","Checkout","testing","doing","P2","2026-03-06","Explore checkout flow on iOS Safari and Android Chrome.","Found scroll issue on address step — BUG-004 raised.","Citra Lestari"],
  [C,3,"Write test cases for COD payment","EcoShop Web","Payment","documentation","todo","P2","2026-03-08","Create positive and negative test cases for Cash on Delivery.","","Budi Santoso"],
  [C,3,"Validate order confirmation email","EcoShop Web","Notifications","testing","todo","P2","2026-03-07","Check email template, links, and data accuracy post-order.","","Eko Wijaya"],
  [C,3,"API test — /orders/create endpoint","EcoShop Web","Orders API","testing","doing","P1","2026-03-05","Test request/response structure, validation, and error codes.","Using Postman collection v3.","Andi Pratama"],
  [C,3,"Performance test checkout page","EcoShop Web","Performance","investigation","todo","P3","2026-03-10","Measure LCP and FID on checkout under 100 concurrent users.","","Citra Lestari"],
  [C,3,"Update test plan Sprint 3","EcoShop Web","Test Planning","documentation","done","P1","2026-03-01","Finalize scope, assign suites, and set milestones.","Approved by lead.","Wahyu Simbolon"],
  [C,2,"Regression test product search","EcoShop Web","Search","testing","done","P1","2026-01-25","Full regression after search algorithm update.","","Andi Pratama"],
  [C,2,"Test product filter combinations","EcoShop Web","Filter","testing","done","P2","2026-01-24","Verify filter by category, price range, and rating combinations.","","Dewi Kusuma"],
  [C,2,"Write TC for product detail page","EcoShop Web","Product Detail","documentation","done","P2","2026-01-20","Create test cases covering images, stock status, and add-to-cart.","","Budi Santoso"],
  [C,2,"Investigate slow product load","EcoShop Web","Performance","investigation","done","P2","2026-01-22","Root cause analysis for >3s load on product list page.","Identified N+1 query, reported to dev.","Eko Wijaya"],
  [C,1,"Test user registration flow","EcoShop Web","Auth","testing","done","P1","2026-01-10","E2E test for email registration and OTP verification.","","Dewi Kusuma"],
  [C,1,"Test login with Google OAuth","EcoShop Web","Auth","testing","done","P1","2026-01-08","Verify Google sign-in integration and session handling.","","Andi Pratama"],
  [C,1,"Write test cases for forgot password","EcoShop Web","Auth","documentation","done","P2","2026-01-07","Cover happy path, expired token, and invalid email.","","Budi Santoso"],
  [C,3,"Follow up BUG-017 retest","EcoShop Web","Cart","follow-up","todo","P1","2026-03-06","Retest after dev confirms fix for quantity update bug.","Waiting for build 3.4.2.","Andi Pratama"],
  [C,3,"Meeting action: align QA & dev on API contract","EcoShop Web","Orders API","meeting-action","todo","P2","2026-03-08","Follow up from sprint planning — document agreed API error codes.","","Wahyu Simbolon"],
  [C,3,"Accessibility audit — checkout form","EcoShop Web","Accessibility","testing","todo","P3","2026-03-12","Run axe-core scan and manual keyboard navigation test.","","Citra Lestari"],
  [C,3,"Smoke test after deployment v3.4","EcoShop Web","Smoke Test","testing","todo","P1","2026-03-09","Run smoke suite on staging after v3.4 deployment.","","Wahyu Simbolon"],
  [C,4,"Plan Sprint 4 test scope","EcoShop Web","Test Planning","documentation","todo","P1","2026-03-15","Define test scope for order management features.","","Wahyu Simbolon"],
];
tasks.forEach(t => iTask.run(...t));
console.log("✓ Tasks (22)");

// ── BUGS (22) ─────────────────────────────────────────────────
const iBug = db.prepare(`INSERT INTO "Bug" ("company","sprintId","project","module","bugType","title","preconditions","stepsToReproduce","expectedResult","actualResult","severity","priority","status","evidence","suggestedDev") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const bugs = [
  [C,3,"EcoShop Web","Checkout","Functional","Page crashes with 500 error on checkout submit","User is logged in with items in cart","1. Add item to cart\n2. Proceed to checkout\n3. Fill all fields\n4. Click Submit Order","Order is placed and confirmation page shown","Server returns 500 Internal Server Error","critical","P1","open","","Backend Team"],
  [C,3,"EcoShop Web","Payment","API","Payment gateway returns 422 for valid card","Sandbox mode active, valid test card used","1. Go to checkout\n2. Enter valid test card 4111111111111111\n3. Click Pay","Payment processed successfully","422 Unprocessable Entity from Midtrans","critical","P1","in_progress","","Payment Team"],
  [C,3,"EcoShop Web","Cart","Functional","Cart quantity does not update when changed","User has 1 item in cart","1. Open cart\n2. Change quantity to 3\n3. Click Update","Quantity updates to 3, total recalculates","Quantity stays at 1, total unchanged","high","P1","closed","","Frontend Team"],
  [C,3,"EcoShop Web","Checkout","UI/UX","Address form layout broken on mobile","Open on iOS Safari 16","1. Navigate to checkout\n2. Tap on address form","Form fields display properly stacked","Fields overlap and some are hidden below fold","high","P2","open","","Frontend Team"],
  [C,3,"EcoShop Web","Payment","Functional","COD option missing for certain zip codes","User selects COD payment","1. Enter zip code 12345\n2. Select payment method","COD option available","COD not shown in payment list","medium","P2","open","","Backend Team"],
  [C,3,"EcoShop Web","Notifications","Functional","Order confirmation email not sent after purchase","Order placed successfully","1. Complete checkout\n2. Check registered email inbox","Email received within 5 minutes","No email received after 30 minutes","high","P1","open","","Backend Team"],
  [C,2,"EcoShop Web","Search","Functional","Search returns no results for valid product name","Products exist in catalog","1. Type Kemeja Putih in search bar\n2. Press Enter","Matching products displayed","Empty results page shown","high","P1","closed","","Search Team"],
  [C,2,"EcoShop Web","Product Detail","UI/UX","Product images not loading on detail page","Stable internet connection","1. Click on any product\n2. View product detail page","Product images load correctly","Broken image icons shown","medium","P2","closed","","Frontend Team"],
  [C,2,"EcoShop Web","Filter","Functional","Price range filter returns incorrect results","Products loaded in catalog","1. Set price filter to 50k-100k\n2. Apply filter","Only products within range shown","Products outside range included in results","medium","P2","closed","","Backend Team"],
  [C,2,"EcoShop Web","Performance","Performance","Product list page loads in over 5s on low-end device","Testing on mid-range Android","1. Open product listing page","Page loads within 2 seconds","Page takes 5-8 seconds to load","medium","P2","closed","","Frontend Team"],
  [C,1,"EcoShop Web","Authentication","Functional","OTP not delivered for Gmail accounts","User registered with Gmail","1. Register with gmail.com email\n2. Wait for OTP","OTP delivered within 1 minute","OTP never arrives for Gmail domains","critical","P1","closed","","Backend Team"],
  [C,1,"EcoShop Web","Authentication","Functional","Login fails after password reset","User has reset password","1. Reset password via email link\n2. Login with new password","User logged in successfully","Login fails with invalid credentials","critical","P1","closed","","Backend Team"],
  [C,1,"EcoShop Web","Authentication","Security","Session not invalidated after logout","User logged in","1. Log in\n2. Log out\n3. Press back button","Session expired, redirected to login","Previous page accessible, session still active","high","P1","closed","","Backend Team"],
  [C,3,"EcoShop Web","Checkout","Validation","Promo code field accepts expired codes","Expired promo code TEST50OFF","1. Enter expired code TEST50OFF\n2. Apply","Error: Promo code expired","Discount applied successfully","medium","P2","open","","Backend Team"],
  [C,3,"EcoShop Web","Orders","Functional","Order status not updating in real-time","Order placed and confirmed","1. Place an order\n2. Check order status page\n3. Wait for status update from seller","Status updates within 30 seconds","Status stuck at Processing for over 10 min","medium","P2","open","","Backend Team"],
  [C,3,"EcoShop Web","Checkout","UI/UX","Delivery address not pre-filled from profile","User has saved address in profile","1. Log in\n2. Go to checkout","Saved address auto-filled in form","Empty address form shown","low","P3","open","","Frontend Team"],
  [C,2,"EcoShop Web","Product Detail","Functional","Add to cart button unresponsive for out-of-stock items","Out-of-stock product page","1. Open out-of-stock product\n2. Click Add to Cart","Button disabled or shows Out of Stock message","Button clickable, no response, no error shown","medium","P2","closed","","Frontend Team"],
  [C,3,"EcoShop Web","Cart","Functional","Cart badge count not updating after item removal","2 items in cart","1. Open cart\n2. Remove one item","Badge shows updated count immediately","Badge still shows old count until page refresh","low","P3","open","","Frontend Team"],
  [C,3,"EcoShop Web","Payment","API","Duplicate order created on payment timeout","Slow network simulated","1. Submit payment\n2. Simulate timeout by cutting network","Single order created or retry prompt shown","Two identical orders created","critical","P1","in_progress","","Backend Team"],
  [C,2,"EcoShop Web","Search","UI/UX","Search suggestions overlap with keyboard on mobile","Mobile device with soft keyboard","1. Tap search bar\n2. Type 2 characters","Suggestions appear above keyboard","Suggestions hidden behind keyboard","low","P3","closed","","Frontend Team"],
  [C,3,"EcoShop Web","Checkout","Functional","Total price miscalculates when applying multiple promos","Two valid promo codes","1. Add item totaling 100k\n2. Apply DISC10 (10%)\n3. Apply DISC20 (20%)","Promos stack correctly, highest applies","Total shows negative value","critical","P1","open","","Backend Team"],
  [C,3,"EcoShop Web","Notifications","Functional","Push notification not triggered for order shipped status","FCM configured, order placed","1. Place order\n2. Seller marks as shipped","Push notification received on device","No notification sent","medium","P2","open","","Backend Team"],
];
bugs.forEach(b => iBug.run(...b));
console.log("✓ Bugs (22)");

// ── TEST PLANS (4) ────────────────────────────────────────────
const iPlan = db.prepare(`INSERT INTO "TestPlan" ("company","publicToken","title","project","sprint","scope","status","startDate","endDate","assignee","notes") VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
const pt = [tok(), tok(), tok(), tok()];
iPlan.run(C,pt[0],"Test Plan — Sprint 1: Auth & Onboarding","EcoShop Web","Sprint 1","Registration, Login, OAuth, Password Reset, Session Management","closed","2026-01-01","2026-01-14","Wahyu Simbolon","All critical auth flows must pass before sprint close.");
iPlan.run(C,pt[1],"Test Plan — Sprint 2: Product Catalog","EcoShop Web","Sprint 2","Product Listing, Search, Filter, Product Detail, Reviews","closed","2026-01-15","2026-01-28","Wahyu Simbolon","Focus on search accuracy and filter correctness.");
iPlan.run(C,pt[2],"Test Plan — Sprint 3: Checkout & Payment","EcoShop Web","Sprint 3","Cart, Checkout, Payment Gateway, Promo Code, Order Confirmation","active","2026-03-01","2026-03-14","Wahyu Simbolon","Payment integration is highest priority. Block release on P1 bugs.");
iPlan.run(C,pt[3],"Test Plan — Sprint 4: Order Management","EcoShop Web","Sprint 4","Order History, Status Tracking, Notifications, Returns","draft","2026-03-15","2026-03-28","Wahyu Simbolon","Draft — pending sprint kickoff.");
console.log("✓ Test Plans (4)");

// ── TEST SUITES (12) ──────────────────────────────────────────
const iSuite = db.prepare(`INSERT INTO "TestSuite" ("company","publicToken","testPlanId","title","assignee","status","notes") VALUES (?,?,?,?,?,?,?)`);
const st = Array.from({length:12}, () => tok());
iSuite.run(C,st[0],"1","TS-001: User Registration","Dewi Kusuma","active","Covers email signup, OTP verification, and profile setup.");
iSuite.run(C,st[1],"1","TS-002: Login & Logout","Andi Pratama","active","All login methods including Google OAuth and credential login.");
iSuite.run(C,st[2],"1","TS-003: Password Management","Budi Santoso","active","Forgot password, reset via email, change password in profile.");
iSuite.run(C,st[3],"2","TS-004: Product Search","Andi Pratama","active","Keyword search, autocomplete suggestions, no-results handling.");
iSuite.run(C,st[4],"2","TS-005: Product Filter & Sort","Dewi Kusuma","active","Category, price, rating filters and sort by relevance or price.");
iSuite.run(C,st[5],"2","TS-006: Product Detail Page","Budi Santoso","active","Image gallery, stock indicator, reviews, add to cart button.");
iSuite.run(C,st[6],"3","TS-007: Shopping Cart","Andi Pratama","active","Add, remove, update quantity, cart persistence, badge count.");
iSuite.run(C,st[7],"3","TS-008: Checkout Flow","Wahyu Simbolon","active","Address selection, delivery options, order summary, submit.");
iSuite.run(C,st[8],"3","TS-009: Payment — Credit Card","Citra Lestari","active","Visa/Mastercard via Midtrans, 3DS auth, decline scenarios.");
iSuite.run(C,st[9],"3","TS-010: Payment — E-Wallet & COD","Eko Wijaya","active","DANA, GoPay, OVO, and Cash on Delivery payment flows.");
iSuite.run(C,st[10],"3","TS-011: Promo & Discount Codes","Budi Santoso","draft","Valid codes, expired codes, stacking rules, max discount cap.");
iSuite.run(C,st[11],"4","TS-012: Order History & Status","Dewi Kusuma","draft","Order list, status timeline, receipt download, reorder.");
console.log("✓ Test Suites (12)");

// ── TEST CASES (50) ───────────────────────────────────────────
const iTC = db.prepare(`INSERT INTO "TestCase" ("company","publicToken","testSuiteId","tcId","typeCase","preCondition","caseName","testStep","expectedResult","actualResult","status","priority") VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
const tc = [
  ["1","TC-001","Positive","App open, user not logged in","Register with valid email and password","1. Open register page\n2. Enter valid email\n3. Enter strong password\n4. Click Register","Account created, OTP sent to email","","Passed","High"],
  ["1","TC-002","Negative","App open","Register with already-used email","1. Enter existing email\n2. Enter password\n3. Click Register","Error: Email already registered","","Passed","High"],
  ["1","TC-003","Negative","App open","Register with invalid email format","1. Enter notanemail\n2. Enter password\n3. Click Register","Validation error shown inline","","Passed","Medium"],
  ["1","TC-004","Positive","Registration form submitted","Verify OTP from email","1. Open email\n2. Copy 6-digit OTP\n3. Enter OTP in app","Account verified, redirected to profile setup","","Passed","High"],
  ["1","TC-005","Negative","OTP input shown","Enter expired OTP","1. Wait 10 minutes\n2. Enter OTP","Error: OTP expired, resend option shown","","Passed","Medium"],
  ["2","TC-006","Positive","User registered, on login page","Login with valid credentials","1. Enter email\n2. Enter password\n3. Click Login","User logged in, redirected to home","","Passed","High"],
  ["2","TC-007","Negative","On login page","Login with wrong password","1. Enter correct email\n2. Enter wrong password\n3. Click Login","Error: Invalid credentials","","Passed","High"],
  ["2","TC-008","Positive","On login page","Login with Google OAuth","1. Click Continue with Google\n2. Select account\n3. Authorize","User logged in with Google account","","Passed","High"],
  ["2","TC-009","Positive","User logged in","Logout from account","1. Click profile icon\n2. Click Logout","Session ended, redirected to login","","Passed","Medium"],
  ["2","TC-010","Negative","Account locked after 5 failed logins","Attempt login after account lock","1. Enter correct credentials","Error: Account locked, check email to unlock","","Passed","High"],
  ["3","TC-011","Positive","On login page","Request password reset","1. Click Forgot Password\n2. Enter registered email\n3. Submit","Reset link sent to email","","Passed","High"],
  ["3","TC-012","Positive","Reset email received","Reset password via link","1. Click link in email\n2. Enter new password\n3. Confirm","Password updated, can login with new password","","Passed","High"],
  ["3","TC-013","Negative","On reset page","Use expired reset link","1. Wait 24 hours\n2. Click old reset link","Error: Link expired","","Passed","Medium"],
  ["3","TC-014","Negative","Logged in, profile page","Change to same password as current","1. Enter current password\n2. Enter same as new\n3. Submit","Error: New password must be different","Accepted without error","Failed","Medium"],
  ["4","TC-015","Positive","On home page, products exist","Search with exact product name","1. Type Kemeja Putih in search\n2. Press Enter","Matching products appear in results","","Passed","High"],
  ["4","TC-016","Positive","On home page","Search with partial keyword","1. Type kem in search bar","Autocomplete suggestions appear","","Passed","Medium"],
  ["4","TC-017","Negative","On home page","Search with no matching keyword","1. Type xyzproductnotexist\n2. Press Enter","Empty state with No products found","","Passed","Medium"],
  ["4","TC-018","Positive","On search results page","Pagination works on search results","1. Search baju\n2. Scroll to bottom\n3. Click Next Page","Next page of results loads","","Passed","Low"],
  ["4","TC-019","Negative","On search page","Search with special characters","1. Type script tags\n2. Search","Safe empty results or sanitized query shown","","Passed","High"],
  ["5","TC-020","Positive","Products loaded in catalog","Filter by price range 50k-100k","1. Open filter panel\n2. Set min 50000 max 100000\n3. Apply","Only products in range shown","","Passed","High"],
  ["5","TC-021","Positive","Products loaded","Filter by category Pakaian Pria","1. Select category\n2. Apply","Only men clothing shown","","Passed","Medium"],
  ["5","TC-022","Positive","Products loaded","Sort by price low to high","1. Click Sort\n2. Select Price Low to High","Products re-ordered by ascending price","","Passed","Medium"],
  ["5","TC-023","Negative","Filter applied","Apply filter with no matching products","1. Set price 1-100\n2. Apply","Empty state shown with clear filter option","","Passed","Low"],
  ["6","TC-024","Positive","On product listing","Open product detail page","1. Click on any product card","Product detail page loads with all info","","Passed","High"],
  ["6","TC-025","Positive","On product detail","View product image gallery","1. Click thumbnail images\n2. Swipe main image","Images change accordingly","","Passed","Medium"],
  ["6","TC-026","Positive","In-stock product","Add to cart from detail page","1. Select size or variant\n2. Click Add to Cart","Item added, cart badge increments","","Passed","High"],
  ["6","TC-027","Negative","Out-of-stock product","Attempt to add OOS product to cart","1. Open OOS product\n2. Click Add to Cart","Button disabled, Out of Stock message shown","Button clickable but nothing happens","Failed","High"],
  ["7","TC-028","Positive","Item in cart","Update item quantity in cart","1. Open cart\n2. Change qty from 1 to 3\n3. Click Update","Quantity updates, total recalculates","Quantity unchanged after click","Failed","High"],
  ["7","TC-029","Positive","Item in cart","Remove item from cart","1. Open cart\n2. Click delete on item","Item removed, cart updates correctly","","Passed","High"],
  ["7","TC-030","Negative","Empty cart","Proceed to checkout with empty cart","1. Open empty cart\n2. Click Checkout","Error shown or checkout button disabled","","Passed","Medium"],
  ["7","TC-031","Positive","User logged in with cart items","Cart persists after logout and re-login","1. Add item to cart\n2. Logout\n3. Login again","Cart items still present","","Passed","Medium"],
  ["7","TC-032","Negative","2 items in cart","Remove item and verify badge updates","1. Remove 1 item\n2. Check nav badge","Badge count decrements immediately","Badge still shows old count","Failed","Low"],
  ["8","TC-033","Positive","Cart has items, user logged in","Complete checkout with saved address","1. Go to cart\n2. Click Checkout\n3. Select saved address\n4. Choose shipping\n5. Submit","Order confirmation page shown","","Pending","High"],
  ["8","TC-034","Negative","On checkout page","Submit checkout without selecting shipping","1. Fill address\n2. Skip shipping selection\n3. Submit","Validation error: shipping required","","Pending","High"],
  ["8","TC-035","Positive","On checkout page","Apply valid promo code DISC10","1. Enter DISC10\n2. Click Apply","10% discount applied to total","","Pending","Medium"],
  ["8","TC-036","Negative","On checkout page","Apply expired promo code TEST50OFF","1. Enter TEST50OFF\n2. Click Apply","Error: Promo code expired","Discount applied erroneously","Failed","Medium"],
  ["8","TC-037","Positive","Checkout complete","Check order confirmation page","1. Complete checkout\n2. View confirmation","Order ID shown, summary correct, email sent","","Pending","High"],
  ["9","TC-038","Positive","On payment step","Pay with valid Visa test card","1. Enter 4111111111111111\n2. Enter expiry and CVV\n3. Submit","Payment processed, order confirmed","","Pending","High"],
  ["9","TC-039","Negative","On payment step","Pay with declined test card","1. Enter decline test card 4000000000000002\n2. Submit","Error: Card declined, retry option shown","","Pending","High"],
  ["9","TC-040","Negative","On payment step","Submit with expired card","1. Enter card with past expiry\n2. Submit","Validation error: Card expired","","Pending","Medium"],
  ["9","TC-041","Positive","Payment submitted","3DS authentication flow","1. Complete payment form\n2. Handle 3DS popup\n3. Authenticate","Payment processed after 3DS auth","","Pending","High"],
  ["10","TC-042","Positive","DANA linked on payment step","Pay with DANA e-wallet","1. Select DANA\n2. Authorize in DANA app","Payment deducted from DANA balance","","Pending","High"],
  ["10","TC-043","Positive","On payment step","Pay with Cash on Delivery","1. Select COD\n2. Submit order","Order placed, COD instructions shown","","Pending","High"],
  ["10","TC-044","Negative","On payment step","Attempt COD for unavailable zip code","1. Select COD\n2. Enter zip 99999 where no COD available","Error: COD not available for this area","COD option shown and selectable","Failed","Medium"],
  ["10","TC-045","Negative","On payment step","Pay with insufficient GoPay balance","1. Select GoPay\n2. Authorize","Error: Insufficient balance in GoPay","","Pending","Medium"],
  ["11","TC-046","Positive","On checkout page","Apply valid percentage promo code DISC20","1. Enter DISC20\n2. Click Apply","20% discount shown in order summary","","Pending","High"],
  ["11","TC-047","Negative","On checkout page","Apply already-used promo code","1. Enter used code NEWUSER50\n2. Apply","Error: Promo code already used","","Pending","Medium"],
  ["11","TC-048","Negative","Cart total 40k, minimum order required","Apply promo with minimum order requirement","1. Enter MIN100K promo min 100k\n2. Apply","Error: Minimum order not met","","Pending","Medium"],
  ["11","TC-049","Negative","Two promos already applied","Apply third promo code","1. Apply two valid promos\n2. Try applying third","Error: Maximum 2 promos per order","","Pending","Low"],
  ["11","TC-050","Negative","On checkout page","Multiple promos causing negative total","1. Apply DISC10\n2. Apply DISC20\n3. Check total","Total cannot go below 0, minimum 1000","Negative total displayed","Failed","High"],
];
tc.forEach(([suiteId, tcId, typeCase, preCondition, caseName, testStep, expectedResult, actualResult, status, priority]) => {
  iTC.run(C, tok(), suiteId, tcId, typeCase, preCondition, caseName, testStep, expectedResult, actualResult, status, priority);
});
console.log("✓ Test Cases (50)");

// ── TEST SESSIONS (10) ────────────────────────────────────────
const iSess = db.prepare(`INSERT INTO "TestSession" ("company","date","project","sprint","tester","scope","totalCases","passed","failed","blocked","result","notes") VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
iSess.run(C,"2026-01-10","EcoShop Web","Sprint 1","Dewi Kusuma","TS-001: User Registration","5","5","0","0","pass","All registration TCs passed cleanly.");
iSess.run(C,"2026-01-11","EcoShop Web","Sprint 1","Andi Pratama","TS-002: Login & Logout","5","4","1","0","fail","TC-010 failed — account lock mechanism missing.");
iSess.run(C,"2026-01-12","EcoShop Web","Sprint 1","Budi Santoso","TS-003: Password Management","4","3","1","0","fail","TC-014 failed — same-password validation missing.");
iSess.run(C,"2026-01-20","EcoShop Web","Sprint 2","Andi Pratama","TS-004: Product Search","5","5","0","0","pass","Search working correctly after hotfix.");
iSess.run(C,"2026-01-21","EcoShop Web","Sprint 2","Dewi Kusuma","TS-005: Product Filter & Sort","4","4","0","0","pass","All filter combinations passed.");
iSess.run(C,"2026-01-22","EcoShop Web","Sprint 2","Budi Santoso","TS-006: Product Detail Page","4","3","1","0","fail","TC-027 — OOS add-to-cart not disabled.");
iSess.run(C,"2026-03-03","EcoShop Web","Sprint 3","Wahyu Simbolon","TS-007: Shopping Cart","5","2","3","0","fail","BUG-003 and BUG-018 raised from this session.");
iSess.run(C,"2026-03-04","EcoShop Web","Sprint 3","Andi Pratama","TS-007: Cart Regression (post-hotfix)","5","5","0","0","pass","BUG-003 confirmed fixed. All cart TCs pass.");
iSess.run(C,"2026-03-05","EcoShop Web","Sprint 3","Citra Lestari","TS-009: Payment Credit Card","4","0","2","2","fail","BUG-002 open — payment gateway not stable in sandbox.");
iSess.run(C,"2026-03-06","EcoShop Web","Sprint 3","Eko Wijaya","TS-010: E-Wallet & COD","4","1","2","1","fail","TC-044 failed, TC-045 blocked pending sandbox fix.");
console.log("✓ Test Sessions (10)");

// ── MEETING NOTES (10) ────────────────────────────────────────
const iMtg = db.prepare(`INSERT INTO "MeetingNote" ("company","publicToken","date","project","title","attendees","content","actionItems") VALUES (?,?,?,?,?,?,?,?)`);
iMtg.run(C,tok(),"2026-01-02","EcoShop Web","Sprint 1 Kickoff Meeting","Wahyu Simbolon, Andi Pratama, Dewi Kusuma, Budi Santoso, Dev Team","Discussed scope for Sprint 1. QA will focus on auth flows. Dev team to provide staging env by Jan 3.","1. Wahyu: Finalize test plan by Jan 3\n2. Dev: Deploy staging by Jan 3\n3. All: Review acceptance criteria");
iMtg.run(C,tok(),"2026-01-14","EcoShop Web","Sprint 1 Retrospective","QA Team, Product Manager","Sprint 1 completed with 2 P1 bugs found and fixed. OTP delivery for Gmail was major blocker.","1. Wahyu: Document learnings\n2. Dev: Monitor OTP delivery rate in production");
iMtg.run(C,tok(),"2026-01-15","EcoShop Web","Sprint 2 Kickoff Meeting","Full QA Team, Dev Team, Product","Scope for Sprint 2 covers product catalog. Priority is search accuracy and filter performance.","1. Budi: Write TC for product detail by Jan 17\n2. Citra: Set up performance test baseline");
iMtg.run(C,tok(),"2026-01-28","EcoShop Web","Sprint 2 Retrospective","QA Team, Scrum Master","3 bugs found, 2 closed. Product detail OOS issue deferred to Sprint 3 backlog.","1. Wahyu: Add OOS bug to Sprint 3 criteria\n2. All: Update TCs for revised filter logic");
iMtg.run(C,tok(),"2026-02-28","EcoShop Web","Sprint 3 Kickoff & Test Planning","Full QA Team, Dev Team, PO","Payment integration is highest risk. QA to start sandbox testing Day 1. COD scope limited to Jabodetabek.","1. Wahyu: Create test plan by Mar 1\n2. Citra: Configure Midtrans sandbox\n3. Eko: Document COD zip code list");
iMtg.run(C,tok(),"2026-03-03","EcoShop Web","Bug Triage Meeting — Sprint 3","QA Lead, Dev Lead, Product","Reviewed 5 open bugs. BUG-001 and BUG-019 classified as release blockers. BUG-016 deferred.","1. Dev: Fix BUG-001 by Mar 5\n2. Dev: Fix BUG-019 by Mar 6\n3. Wahyu: Update test plan risk section");
iMtg.run(C,tok(),"2026-03-05","EcoShop Web","API Contract Alignment","QA Team, Backend Team","Aligned on /orders/create error response codes. QA to update API test collection accordingly.","1. Andi: Update Postman collection\n2. Backend: Share swagger for orders API");
iMtg.run(C,tok(),"2026-03-06","EcoShop Web","Daily Standup — March 6","QA Team","BUG-003 confirmed fixed. BUG-002 still open. Citra found mobile layout issue BUG-004.","1. Dewi: Retest BUG-004 on multiple devices\n2. Andi: Continue API test suite");
iMtg.run(C,tok(),"2026-03-08","EcoShop Web","Mid-Sprint Check-in","QA Team, Product Manager","7 of 22 planned TCs executed. On track. 3 critical bugs still open.","1. Wahyu: Daily bug status report to PM\n2. All: Prioritize checkout suite this week");
iMtg.run(C,tok(),"2026-03-15","EcoShop Web","Sprint 4 Planning","Full Team","Scope: order history, notifications, returns. QA to draft test plan.","1. Wahyu: Draft test plan Sprint 4 by Mar 16\n2. Budi: Write TC for order history");
console.log("✓ Meeting Notes (10)");

// ── ACTIVITY LOG (20) ─────────────────────────────────────────
const iAct = db.prepare(`INSERT INTO "ActivityLog" ("company","entityType","entityId","action","summary") VALUES (?,?,?,?,?)`);
const acts = [
  [C,"Bug","1","created","BUG-001 created: Page crashes with 500 error on checkout submit [critical]"],
  [C,"Bug","2","created","BUG-002 created: Payment gateway returns 422 for valid card [critical]"],
  [C,"Bug","3","status_update","BUG-003 status updated: open → in_progress"],
  [C,"Task","1","created","TASK-001 created: Verify checkout flow end-to-end [P1]"],
  [C,"Task","3","status_update","TASK-003 completed: Regression test after cart hotfix — all cases passed"],
  [C,"TestCase","28","status_update","TC-028 status: Pending → Failed — cart quantity update not working"],
  [C,"TestCase","27","status_update","TC-027 status: Pending → Failed — OOS add-to-cart button not disabled"],
  [C,"TestSession","7","created","Session created: Shopping Cart Suite — 5 cases, 2 passed, 3 failed"],
  [C,"TestSession","8","created","Session created: Cart Regression — 5 cases, all passed"],
  [C,"Bug","7","status_update","BUG-007 status: open → closed — search hotfix verified by Andi"],
  [C,"Bug","11","status_update","BUG-011 status: open → closed — OTP Gmail issue resolved"],
  [C,"Bug","12","status_update","BUG-012 status: open → closed — login after reset fixed"],
  [C,"Task","10","status_update","TASK-010 completed: Test plan Sprint 3 finalized and approved"],
  [C,"Bug","19","created","BUG-019 created: Duplicate order on payment timeout [critical] — release blocker"],
  [C,"MeetingNote","6","created","Meeting note created: Bug Triage Meeting Sprint 3"],
  [C,"Bug","21","created","BUG-021 created: Total miscalculates with multiple promos [critical]"],
  [C,"TestCase","36","status_update","TC-036 status: Pending → Failed — expired promo accepted"],
  [C,"Task","18","created","TASK-018 created: Follow up BUG-017 retest after build 3.4.2"],
  [C,"Bug","3","status_update","BUG-003 status: in_progress → closed — cart quantity fix confirmed"],
  [C,"TestPlan","3","created","Test Plan Sprint 3 created: Checkout & Payment scope defined"],
];
acts.forEach(a => iAct.run(...a));
console.log("✓ Activity Logs (20)");

// ── USER ───────────────────────────────────────────────────────
const pwHash = await hashPassword("@Anakjaman1");
db.prepare(`INSERT INTO "User" ("company","name","username","email","password","role") VALUES (?,?,?,?,?,?)`).run(
  C, "Wahyu Simbolon", "admin", "wsherwin.simbolon@magnusdigital.co.id", pwHash, "admin"
);
console.log("✓ User: admin / @Anakjaman1");

db.close();
console.log("\n✅ Seed selesai! → prisma/dev.db");
console.log("   Jalankan: npm run dev");
