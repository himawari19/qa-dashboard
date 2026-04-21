# 🎯 COMPREHENSIVE TEST PLAN - QA DAILY HUB

## Document Information
- **Project**: QA Daily Hub
- **Version**: 0.1.0
- **Date**: April 2026
- **Author**: QA Team
- **Status**: Production Release Testing
- **Platform**: Next.js 16.2.3 + SQLite/PostgreSQL

---

## 1. TEST STRATEGY OVERVIEW

### 1.1 Scope of Testing

| Testing Layer | Coverage Target | Priority |
|--------------|----------------|----------|
| Functional Testing | 100% of features | Critical |
| UI/UX Testing | 100% of components | High |
| Form Validation | 100% of input fields | Critical |
| Error Handling | 100% of error paths | High |
| Edge Cases | All boundary conditions | Medium |
| Integration | All API routes | Critical |
| Security | Authentication only | Critical |
| Performance | Key flows | Medium |
| Regression | Unit tests pass | Critical |

### 1.2 Test Environment

- **Development**: `npm run dev` (localhost:3000)
- **Database**: SQLite (dev.db) / PostgreSQL (Neon for production)
- **Authentication**: Cookie-based session with HMAC signature

---

## 2. FUNCTIONAL TESTING

### 2.1 Authentication Module

#### TC-AUTH-001: Login with Valid Credentials
- **Feature**: Login Page
- **Scenario**: User enters valid username and password
- **Steps**:
  1. Navigate to /login
  2. Enter valid username in username field
  3. Enter valid password in password field
  4. Click "Login" button
- **Expected**: User is redirected to dashboard
- **Severity**: Critical | **Priority**: P1

#### TC-AUTH-002: Login with Invalid Username
- **Feature**: Login Page
- **Scenario**: User enters wrong username
- **Steps**:
  1. Navigate to /login
  2. Enter invalid username
  3. Enter any password
  4. Click "Login" button
- **Expected**: Error message "Invalid username or password."
- **Severity**: High | **Priority**: P1

#### TC-AUTH-003: Login with Invalid Password
- **Feature**: Login Page
- **Scenario**: User enters wrong password
- **Steps**:
  1. Navigate to /login
  2. Enter valid username
  3. Enter invalid password
  4. Click "Login" button
- **Expected**: Error message "Invalid username or password."
- **Severity**: High | **Priority**: P1

#### TC-AUTH-004: Login with Empty Credentials
- **Feature**: Login Page
- **Scenario**: User leaves fields empty
- **Steps**:
  1. Navigate to /login
  2. Click "Login" button without entering credentials
- **Expected**: Browser validation shows "Please fill out this field"
- **Severity**: High | **Priority**: P1

#### TC-AUTH-005: Login Without Environment Configuration
- **Feature**: Login API
- **Scenario**: AUTH_USERNAME not set in environment
- **Steps**:
  1. Remove AUTH_USERNAME from .env
  2. Attempt to login with any credentials
- **Expected**: API returns 500 with error message about missing config
- **Severity**: Critical | **Priority**: P1

#### TC-AUTH-006: Session Persistence
- **Feature**: Session Management
- **Scenario**: User logs in, closes browser, returns
- **Steps**:
  1. Login with valid credentials
  2. Copy session cookie value
  3. Close browser completely
  4. Open new browser with saved cookie
  5. Navigate to /dashboard
- **Expected**: User remains logged in
- **Severity**: High | **Priority**: P1

#### TC-AUTH-007: Logout Functionality
- **Feature**: Logout
- **Scenario**: User clicks logout
- **Steps**:
  1. Login and navigate to any page
  2. Click logout (via API call to /api/auth/logout)
  3. Attempt to access protected page
- **Expected**: Redirected to login, session cookie cleared
- **Severity**: High | **Priority**: P1

#### TC-AUTH-008: Unauthorized Access Redirect
- **Feature**: Middleware Protection
- **Scenario**: Access protected page without login
- **Steps**:
  1. Clear all cookies
  2. Navigate directly to /tasks
- **Expected**: Redirect to /login?next=/tasks
- **Severity**: Critical | **Priority**: P1

#### TC-AUTH-009: Preserve Redirect Path
- **Feature**: Login Redirect
- **Scenario**: User tries to access specific page, gets redirected
- **Steps**:
  1. Navigate to /test-case-management
  2. Get redirected to /login
  3. Login with valid credentials
- **Expected**: After login, redirect to /test-case-management
- **Severity**: Medium | **Priority**: P2

#### TC-AUTH-010: Concurrent Login Attempts
- **Feature**: Session Race Condition
- **Scenario**: User logs in multiple times rapidly
- **Steps**:
  1. Click login button rapidly 3 times
- **Expected**: Only one session active, no errors
- **Severity**: Medium | **Priority**: P2

---

### 2.2 Dashboard Module

#### TC-DASH-001: Dashboard Load
- **Feature**: Dashboard Page
- **Scenario**: User visits dashboard
- **Steps**: Navigate to /
- **Expected**: Dashboard loads with metrics, recent items, sprint info
- **Severity**: Critical | **Priority**: P1

#### TC-DASH-002: Dashboard Empty State
- **Feature**: Dashboard Metrics
- **Scenario**: No data in database
- **Steps**: Clear all tables, visit /
- **Expected**: All metrics show 0, empty recent sections show placeholder
- **Severity**: Medium | **Priority**: P2

#### TC-DASH-003: Dashboard Load Timeout
- **Feature**: Dashboard API Timeout
- **Scenario**: Database query takes >2.5 seconds
- **Steps**: Simulate slow query, visit /
- **Expected**: Show empty data (2.5s fallback kicks in)
- **Severity**: Medium | **Priority**: P2

#### TC-DASH-004: Metrics Display
- **Feature**: Metrics Cards
- **Scenario**: Dashboard with data
- **Steps**: Visit / with tasks/bugs/test-cases in DB
- **Expected**: All 5 metric cards display correct counts
- **Severity**: High | **Priority**: P1

#### TC-DASH-005: Recent Items Display
- **Feature**: Recent Activity
- **Scenario**: Dashboard shows recent items
- **Steps**: Create items, visit /
- **Expected**: Latest 5 items in each category displayed
- **Severity**: High | **Priority**: P1

#### TC-DASH-006: Sprint Info Display
- **Feature**: Sprint Progress
- **Scenario**: Active sprint exists
- **Steps**: Create sprint with status='active', visit /
- **Expected**: Sprint name, dates, progress percentage shown
- **Severity**: Medium | **Priority**: P2

---

### 2.3 Module CRUD Operations

#### 2.3.1 Tasks Module

| TC ID | Scenario | Expected | Severity |
|-------|---------|----------|----------|
| TASK-001 | Create task - all fields valid | Task created successfully | Critical |
| TASK-002 | Create task - title missing | Validation error | Critical |
| TASK-003 | Create task - project missing | Validation error | Critical |
| TASK-004 | Create task - description missing | Validation error | Critical |
| TASK-005 | Update task status | Status updated | Critical |
| TASK-006 | Delete task | Task removed | Critical |
| TASK-007 | Bulk delete tasks | Multiple tasks removed | High |
| TASK-008 | Invalid priority value | Validation error | High |

#### 2.3.2 Bugs Module

| TC ID | Scenario | Expected | Severity |
|-------|---------|----------|----------|
| BUG-001 | Create bug - all required | Bug created | Critical |
| BUG-002 | Create bug - missing severity | Validation error | Critical |
| BUG-003 | Create bug - missing steps to reproduce | Validation error | Critical |
| BUG-004 | Update bug status | Status updated | Critical |
| BUG-005 | Delete bug | Bug removed | Critical |
| BUG-006 | Bulk status update | All selected bugs updated | High |

#### 2.3.3 Test Cases Module

| TC ID | Scenario | Expected | Severity |
|-------|---------|----------|----------|
| TC-001 | Create scenario | Scenario created | Critical |
| TC-002 | Add test case to scenario | Test case added | Critical |
| TC-003 | Update test case status | Status updated | Critical |
| TC-004 | Delete test case | Test case removed | High |
| TC-005 | Run test cycle | Execution results saved | Critical |

#### 2.3.4 Test Suites Module

| TC ID | Scenario | Expected | Severity |
|-------|---------|----------|----------|
| SUITE-001 | Create suite with case IDs | Suite created | High |
| SUITE-002 | Execute suite | All cases execute | Critical |
| SUITE-003 | Save execution results | All status saved | Critical |
| SUITE-004 | Execute with empty case IDs | Empty suite message | Medium |

#### 2.3.5 Meeting Notes Module

| TC ID | Scenario | Expected | Severity |
|-------|---------|----------|----------|
| MTG-001 | Create meeting note | Note created | Medium |
| MTG-002 | Update meeting note | Note updated | Medium |
| MTG-003 | Delete meeting note | Note removed | Medium |

#### 2.3.6 Daily Logs Module

| TC ID | Scenario | Expected | Severity |
|-------|---------|----------|----------|
| LOG-001 | Create daily log | Log created | Medium |
| LOG-002 | Update daily log | Log updated | Medium |
| LOG-003 | Delete daily log | Log removed | Medium |

#### 2.3.7 API Testing Module

| TC ID | Scenario | Expected | Severity |
|-------|---------|----------|----------|
| API-001 | Create API endpoint | Endpoint saved | High |
| API-002 | Run API request | Response displayed | Critical |
| API-003 | Run with invalid URL | Error displayed | High |
| API-004 | Seed sample data | Sample endpoints added | Medium |

#### 2.3.8 Other Modules

| Module | TC IDs | Coverage |
|--------|-------|----------|
| test-plans | PLAN-001 to PLAN-005 | CRUD operations |
| test-sessions | SESSION-001 to SESSION-005 | CRUD operations |
| workload | WORK-001 to WORK-005 | CRUD operations |
| performance | PERF-001 to PERF-005 | CRUD operations |
| env-config | ENV-001 to ENV-005 | CRUD + credential handling |
| sql-snippets | SQL-001 to SQL-005 | CRUD operations |
| testing-assets | ASSET-001 to ASSET-005 | CRUD operations |

---

### 2.4 Search Functionality

| TC ID | Scenario | Expected | Severity |
|-------|---------|----------|----------|
| SEARCH-001 | Search with valid query | Results displayed | High |
| SEARCH-002 | Search with short query (<2 chars) | Empty results | Medium |
| SEARCH-003 | Search with no results | Empty results message | Medium |
| SEARCH-004 | Search special characters | Handled gracefully | Medium |

---

### 2.5 Import/Export Operations

| TC ID | Scenario | Expected | Severity |
|-------|---------|----------|----------|
| IMPORT-001 | Import valid Excel | Data imported | High |
| IMPORT-002 | Import invalid format | Error message | High |
| IMPORT-003 | Import with template | Template downloaded | Medium |
| EXPORT-001 | Export single module | Excel downloaded | High |
| EXPORT-002 | Export all modules | Multi-sheet Excel | High |

---

## 3. UI/UX TESTING

### 3.1 Layout Consistency

| TC ID | Component | Test | Severity |
|------|-----------|------|----------|
| UI-001 | Sidebar | Consistent across all pages | High |
| UI-002 | Header | Menu items aligned | Medium |
| UI-003 | Footer | Not applicable (none) | Low |
| UI-004 | Forms | Consistent field styling | High |

### 3.2 Responsive Behavior

| TC ID | Device | Width | Expected |
|------|--------|------|----------|
| RESP-001 | Desktop | 1920px | Full layout |
| RESP-002 | Tablet | 768px | Collapsible sidebar |
| RESP-003 | Mobile | 375px | Hamburger menu |

### 3.3 Component States

| TC ID | Component | State | Expected |
|------|---------|-------|----------|
| STATE-001 | Buttons | Default, Hover, Active, Disabled | Visual feedback |
| STATE-002 | Inputs | Default, Focus, Error, Disabled | Border color change |
| STATE-003 | Loading | Spinner visible | While API call in progress |
| STATE-004 | Empty | Placeholder message | When no data |

---

## 4. FORM VALIDATION TESTING

### 4.1 Required Fields

Each module has required fields that must be tested:

| Module | Required Fields |
|--------|---------------|
| Tasks | title, project, relatedFeature, category, status, priority, description |
| Bugs | project, module, bugType, title, preconditions, stepsToReproduce, expectedResult, actualResult, severity, priority, status |
| Test Cases | projectName, moduleName, referenceDocument, createdBy |
| Meeting Notes | date, title, project, participants, summary, decisions, actionItems |
| Daily Logs | date, project, whatTested, issuesFound, progressSummary, nextPlan |

### 4.2 Input Format Validation

| TC ID | Field | Test Value | Expected |
|-------|-------|-----------|----------|
| VAL-001 | URL field | Valid https:// URL | Accept |
| VAL-002 | URL field | Invalid "not-a-url" | Reject with message |
| VAL-003 | Priority enum | P0, P1, P2, P3 | Accept |
| VAL-004 | Priority enum | P99 | Reject |
| VAL-005 | Status enum | todo, doing, done | Accept |
| VAL-006 | Status enum | invalid_status | Reject |

---

## 5. ERROR HANDLING TESTING

### 5.1 HTTP Error Codes

| TC ID | Error | Scenario | Expected Message |
|-------|-------|----------|-----------------|
| ERR-001 | 404 | Access non-existent page | "Not Found" page |
| ERR-002 | 500 | API throws exception | "Failed to save data" or similar |
| ERR-003 | 401 | Unauthorized API call | Redirect to login |
| ERR-004 | 400 | Invalid API payload | Specific validation error |

### 5.2 API Error Responses

| TC ID | Route | Scenario | Expected |
|-------|-------|----------|----------|
| API-ERR-001 | POST /api/items/tasks | Missing required | Validation error message |
| API-ERR-002 | POST /api/items/tasks | Invalid module | "Module tidak dikenal" |
| API-ERR-003 | DELETE /api/items/tasks | Missing ID | "ID tidak valid" |
| API-ERR-004 | POST /api/import/tasks | No file | "File .xlsx wajib diunggah" |

### 5.3 User-Friendly Error Messages

All error messages should be:
- [ ] Clear and actionable
- [ ] In user's language (Indonesian)
- [ ] Non-technical (no stack traces shown to user)
- [ ] Consistent format

---

## 6. EDGE CASE TESTING

### 6.1 Empty States

| TC ID | Scenario | Expected |
|-------|----------|----------|
| EDGE-001 | No tasks | "No tasks added yet" message |
| EDGE-002 | No bugs | "No bugs added yet" message |
| EDGE-003 | No test cases | "No test cases in this scenario" |
| EDGE-004 | No search results | "No results found" |

### 6.2 Boundary Values

| TC ID | Scenario | Expected |
|-------|----------|----------|
| BND-001 | Create 1000+ tasks | Performance acceptable |
| BND-002 | Very long text in description | Truncated display or scroll |
| BND-003 | Special characters in title | Displayed correctly |
| BND-004 | Unicode in text fields | Saved and displayed correctly |

### 6.3 Rapid Actions

| TC ID | Scenario | Expected |
|-------|----------|----------|
| RAPID-001 | Double-click submit | Only one record created |
| RAPID-002 | Rapid page refresh | No duplicate requests |
| RAPID-003 | Multiple fast form submissions | Queued/bounced |

---

## 7. INTEGRATION TESTING

### 7.1 API-UI Consistency

| TC ID | Test | Severity |
|------|------|----------|
| INT-001 | Create via UI → appears in list | Critical |
| INT-002 | Update via UI → persisted in DB | Critical |
| INT-003 | Delete via UI → removed from list | Critical |
| INT-004 | Search → matches list results | High |

### 7.2 Data Flow

| TC ID | Flow | Expected |
|------|------|----------|
| FLOW-001 | Login → Dashboard → Create Task → List shows new task | End-to-end works |
| FLOW-002 | Create Test Case → Add Test Steps → Execute → Save Results | Full cycle works |

---

## 8. PERFORMANCE TESTING

### 8.1 Page Load Times

| TC ID | Page | Target | Severity |
|------|------|--------|----------|
| PERF-001 | Dashboard | <3 seconds | Medium |
| PERF-002 | Module list (>100 items) | <5 seconds | Medium |
| PERF-003 | API response | <2 seconds | Medium |

### 8.2 Database Operations

| TC ID | Operation | Target | Severity |
|------|-----------|--------|----------|
| DB-001 | Create record | <500ms | Medium |
| DB-002 | Query with filter | <1 second | Medium |
| DB-003 | Bulk update (10 items) | <2 seconds | Medium |

---

## 9. SECURITY TESTING

### 9.1 Authentication Security

| TC ID | Test | Severity |
|------|------|----------|
| SEC-001 | SQL Injection in login | Handled, no access | Critical |
| SEC-002 | Cookie tampering | Session invalid, redirect | Critical |
| SEC-003 | Access API without auth | 401 response | Critical |

### 9.2 Input Security

| TC ID | Input | Test | Expected |
|------|-------|------|----------|
| SEC-010 | Task title | `<script>alert(1)</script>` | Displayed as text |
| SEC-011 | Bug description | `'; DROP TABLE Task;--` | Saved as literal |

---

## 10. REGRESSION TESTING

### 10.1 Fixed Bugs Prevention

All previously fixed bugs must be tested:
- [x] Table name mapping for hyphenated modules (meeting-notes, daily-logs, etc.)
- [x] Test case status consistency (Success/Failed/Pending)
- [x] Suite execution save functionality

### 10.2 Unit Test Coverage

| Module | Test Count | Status |
|--------|-----------|--------|
| getTableName mapping | 14 tests | Pass |
| CRUD operations | 45 tests | Pass |
| Status values | 8 tests | Pass |
| **Total** | **67 tests** | **Pass** |

---

## 11. BROWSER COMPATIBILITY

| Browser | Version | Target | Status |
|---------|---------|--------|--------|
| Chrome | Latest | Full support | Tested locally |
| Firefox | Latest | Full support | Not tested yet |
| Edge | Latest | Full support | Not tested yet |
| Safari | Latest | Should work | Not tested yet |

---

## 12. TEST EXECUTION MATRIX

### 12.1 Priority Execution Order

| Priority | Test Cases | Target |
|----------|------------|--------|
| P1 - Critical | All Critical severity | Before release |
| P2 - High | All High severity | Before release |
| P3 - Medium | All Medium severity | After P1/P2 pass |
| P4 - Low | All Low severity | If time permits |

### 12.2 Estimated Execution Time

| Phase | Estimated Time |
|-------|---------------|
| Functional (P1+P2) | 4-6 hours |
| UI/UX (P1+P2) | 2-3 hours |
| Error Handling | 1-2 hours |
| Edge Cases | 1-2 hours |
| Integration | 2-3 hours |
| **Total** | **10-16 hours** |

---

## 13. DEFECT REPORTING TEMPLATE

For any defects found:

```
Defect ID: [Auto-generated]
Title: [Brief description]
Severity: [Critical/High/Medium/Low]
Priority: [P1/P2/P3/P4]
Module: [Affected module]
Page: [URL]
Environment: [Dev/Staging/Production]
Steps to Reproduce:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
Expected: [What should happen]
Actual: [What actually happened]
Screenshots: [Attach if applicable]
```

---

## 14. SIGN-OFF CRITERIA

Before production release, all of the following must be true:

- [ ] All P1 test cases pass
- [ ] All High severity tests pass
- [ ] Build succeeds without errors
- [ ] All 67 unit tests pass
- [ ] No critical security vulnerabilities
- [ ] Performance within acceptable limits
- [ ] No regression in existing features

---

## 15. KNOWN ISSUES (Pre-Testing)

| Issue ID | Description | Status |
|---------|------------|--------|
| KNOWN-001 | Lint has 61 errors (type:any) | Deferred - lint debt |
| KNOWN-002 | No test framework initially | Fixed - vitest added |
| KNOWN-003 | Middleware deprecation warning | Info - Next.js warning |

---

## 📋 SUMMARY

| Category | Count |
|----------|-------|
| Total Test Cases (estimated) | ~150+ |
| Functional Tests | ~80 |
| UI/UX Tests | ~20 |
| Error Handling Tests | ~15 |
| Edge Case Tests | ~15 |
| Integration Tests | ~10 |
| Security Tests | ~10 |
| **Unit Tests** | **67** |

**Test Execution Status**: Ready for execution  
**Estimated Completion**: 10-16 hours  
** blockers**: None

---

*Document Generated: April 2026*  
*Last Updated: April 21, 2026*  
*QA Lead: [QA Team]*