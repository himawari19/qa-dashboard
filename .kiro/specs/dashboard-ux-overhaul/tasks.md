# Implementation Plan: Dashboard UX Overhaul

## Overview

Transform the QA Daily Hub dashboard from a passive data display into an actionable, real-time collaboration hub. Implementation is organized into 5 independently deployable phases, each adding incremental value. All code uses TypeScript with Next.js 16.2 App Router, Tailwind CSS v4, and Phosphor Icons. Database queries use double-quoted camelCase columns with SQLite/Postgres compatibility via `isPostgres`.

## Tasks

- [x] 1. Phase 1: Stat Enhancement (Requirements 1–3)
  - [x] 1.1 Add severity breakdown query and API response fields to `/api/dashboard`
    - In `lib/data-dashboard.ts`, add a query that counts open bugs grouped by severity (Critical, High, Medium, Low) with company-scoped isolation and double-quoted camelCase columns
    - In `app/api/dashboard/route.ts`, add `bugSeverityCounts` object to the response payload with keys `critical`, `high`, `medium`, `low`
    - Ensure graceful fallback: if query fails, omit `bugSeverityCounts` from response without error
    - _Requirements: 1.4, 1.5, 17.2, 17.4_

  - [x] 1.2 Add resolution rate computation and API response fields
    - In `lib/data-dashboard.ts`, add queries for resolved and created counts for current week and previous week, using `isPostgres` branching for date expressions
    - Compute resolution rate as `Math.round((resolved / created) * 100)`, return null when created is 0
    - Compute delta as current week rate minus previous week rate (null if previous week created is 0)
    - Add `resolutionRate` object with `current`, `previousWeek`, `delta` to dashboard API response
    - _Requirements: 2.1, 2.2, 2.5, 2.6_

  - [x] 1.3 Add quality health score computation and API response fields
    - In `lib/data-dashboard.ts`, add query for test pass rate (passed / total executed tests)
    - Implement composite score: `Math.floor(0.4 * clamp(resolutionRate) + 0.3 * clamp(inverseCriticalRatio) + 0.3 * clamp(testPassRate))` with null inputs treated as 0
    - Add `qualityHealthScore` object with `score` and `components` breakdown to dashboard API response
    - _Requirements: 3.1, 3.2, 3.6, 3.7_

  - [x] 1.4 Implement SeverityBreakdown UI component in dashboard StatCard
    - Create severity breakdown display below the "Open Bugs" total in the existing StatCard component
    - Render Critical, High, Medium, Low sub-counts in that order; show 0 for zero counts
    - Each sub-count is a clickable link navigating to `/bugs?severity={level}`
    - Fall back to total-only display when `bugSeverityCounts` is missing from API response
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [x] 1.5 Implement ResolutionRateMetric UI in the WeekPulse section
    - Display resolution rate as integer percentage with "%" suffix
    - Show "N/A" when rate is null (created count is zero)
    - Apply amber color when rate < 70%, emerald when >= 70%
    - Display delta as "+X" or "−X" percentage-point change; omit when delta is null
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.6 Implement QualityHealthScore UI component with circular progress indicator
    - Create circular progress indicator displaying score 0–100
    - Apply color bands: red (<50), amber (50–74), emerald (≥75)
    - Show tooltip indicating which metrics are incomplete when component values are null
    - Display score as 0 with "no data available" tooltip when all inputs are unavailable
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_


- [x] 2. Phase 2: Attention & Activity Upgrade (Requirements 4–7)
  - [x] 2.1 Add `statusChangedAt` and `ageDays` fields to attention items query
    - In `lib/data-dashboard.ts`, modify the attention items query to include the last status-change timestamp
    - Compute `ageDays` using `isPostgres` branching for date difference (julianday vs CURRENT_DATE - col::date)
    - Add `statusChangedAt` (ISO string or null) and `ageDays` (integer or null) to each attention item in the API response
    - Add `moduleType` field ('Bug' | 'Task') to each attention item
    - _Requirements: 5.1, 5.6, 4.3_

  - [x] 2.2 Create `PATCH /api/dashboard/quick-action` endpoint
    - Create `app/api/dashboard/quick-action/route.ts`
    - Accept body: `{ entityType, entityId, action: "assign"|"status", value }`
    - Validate user has admin or superadmin role; return 403 otherwise
    - For "assign": update the assignee field on the target entity
    - For "status": update the status field on the target entity
    - Call `logActivity()` for all mutations
    - Enforce company-scoped isolation on all queries
    - Return consistent error response format on failure
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 17.2, 17.3_

  - [x] 2.3 Create `GET /api/dashboard/activity` endpoint with scope filtering and collapsing
    - Create `app/api/dashboard/activity/route.ts`
    - Accept query params: `scope` ("my"|"team", default "team"), `limit` (max 50)
    - For "my" scope: filter entries where creator matches authenticated user
    - For "team" scope: filter entries by company scope
    - Order by `createdAt` descending, limit to 50
    - Implement collapsing algorithm: group 3+ entries with same (action, entityType, actor) within 5-minute window
    - Return `{ entries, collapsed }` response shape
    - _Requirements: 6.2, 6.3, 6.4, 7.1, 7.2, 7.5, 17.2_

  - [x] 2.4 Implement AgeIndicator UI component
    - Create badge component showing days since last status change
    - Display "Today" for age < 1 day, "{N}d" for N days
    - Apply color coding: slate (1–7d), amber (8–14d), red (>14d)
    - Display "-" in slate when `statusChangedAt` is null
    - Render on every item in the AttentionPanel
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 2.5 Implement QuickActionButtons UI in AttentionPanel
    - Reveal "Assign" and "Change Status" buttons on hover/focus with 100ms transition
    - "Assign" opens searchable dropdown of workspace members (max 50)
    - "Change Status" opens dropdown of module-specific status values
    - Only render for admin/superadmin roles (hide for others)
    - On selection, call `PATCH /api/dashboard/quick-action`
    - Show success toast on completion; refresh AttentionPanel data
    - Show error toast on failure; retain original state
    - Close dropdown on outside click or Escape key
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 2.6 Implement ActivityFeedFilter toggle and CollapsedActivityEntry UI
    - Add toggle control with "My Activity" / "Team Activity" options
    - Default to "Team Activity" on initial load
    - Fetch from `GET /api/dashboard/activity?scope={my|team}` on toggle switch
    - Update entries within 2 seconds without full page reload; preserve scroll position
    - Show loading indicator while fetching; show empty state message when no entries
    - Render collapsed entries as "[count] [entityType] [action] by [actor]"
    - Click collapsed entry to expand (show up to 50 individual entries); click again to re-collapse
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.6_


- [x] 3. Phase 3: Sidebar Restructure (Requirement 8)
  - [x] 3.1 Restructure sidebar navigation groups in `components/sidebar.tsx`
    - Reorder groups to: (untitled Dashboard), Test Management, Work Tracking, Documentation, Reports, System Settings
    - Create "Work Tracking" group containing: Tasks, Bugs, Sprints - in that order
    - Remove "Defects & Tasks" group; relocate its items (Bugs, Tasks) to "Work Tracking"
    - Update "Documentation" group to contain Meeting Notes only (remove Sprints)
    - Move "Deployment Log" from "Documentation" into "Reports" group after existing Report item
    - Ensure all items use icon weight "bold" and Title Case label casing
    - Preserve all existing ROLE_MENU visibility rules - same hrefs per role before and after
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 17.1_


- [x] 4. Phase 4: Real-Time & Collaboration (Requirements 9–11)
  - [x] 4.1 Create `PresenceHeartbeat` table schema and presence data functions
    - Add `PresenceHeartbeat` table to `lib/db.ts` schema init (create table, then indexes)
    - Ensure SQLite/Postgres compatibility with double-quoted camelCase columns
    - In `lib/data-dashboard.ts`, add functions: `upsertHeartbeat(company, userId, userName)`, `getOnlineMembers(company)` (entries within 5 minutes), `removeStalePresence()`
    - _Requirements: 9.2, 9.3, 9.5, 16.7_

  - [x] 4.2 Create `POST /api/dashboard/presence` endpoint
    - Create `app/api/dashboard/presence/route.ts`
    - Accept body: `{ action: "heartbeat" | "disconnect" }`
    - On "heartbeat": upsert user's `lastSeen` timestamp
    - On "disconnect": remove user's presence record
    - Enforce company-scoped isolation
    - _Requirements: 9.2, 9.3, 9.5_

  - [x] 4.3 Create `GET /api/dashboard/events` SSE endpoint
    - Create `app/api/dashboard/events/route.ts`
    - Implement Server-Sent Events stream with 30s heartbeat
    - Emit `presence` events when online members change
    - Emit `notification` events for: assignment to current user, critical bug in user's project
    - Accept `since` query param to retrieve missed notifications (up to 50) on reconnection
    - Authenticate connection; scope by company
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7, 17.2_

  - [x] 4.4 Create `DashboardComment` table schema and comment data functions
    - Add `DashboardComment` table to `lib/db.ts` schema init (create table, then indexes)
    - Ensure SQLite/Postgres compatibility with double-quoted camelCase columns
    - In `lib/data-dashboard.ts`, add functions: `getComments(company, entityType, entityId)`, `createComment(company, entityType, entityId, authorId, authorName, content)`
    - Call `logActivity()` on comment creation
    - _Requirements: 11.1, 11.3, 16.7_

  - [x] 4.5 Create `GET /api/dashboard/comments` and `POST /api/dashboard/comments` endpoints
    - Create `app/api/dashboard/comments/route.ts`
    - GET: accept `entityType` and `entityId` query params; return comments in chronological order (oldest first)
    - POST: accept `{ entityType, entityId, content }`; validate content is 1–2000 chars after trimming
    - Return 400 for empty/whitespace-only/over-2000 content with validation message
    - Enforce company-scoped isolation; check read access for GET, write access for POST
    - Return read-only indicator when user has read but not write access
    - _Requirements: 11.2, 11.3, 11.4, 11.6, 11.7, 17.2, 17.3_

  - [x] 4.6 Implement PresenceIndicator UI component
    - Display up to 10 avatar circles with user initials; show "+N" overflow when >10 online
    - Display online member count alongside avatar list
    - Company-scoped: only show members in same company
    - Include viewing user in online list
    - Show "presence unavailable" fallback message when service is down
    - _Requirements: 9.1, 9.4, 9.5, 9.6, 9.7_

  - [x] 4.7 Implement real-time SSE client with NotificationToast
    - Establish SSE connection to `/api/dashboard/events` on auth
    - Display toast notifications within 3 seconds for: assignment to user, critical bug in user's project
    - Implement exponential backoff reconnection (1s, 2s, 4s, 8s... max 30s, 10 attempts max)
    - Show connection status indicator: connected/reconnecting/disconnected
    - On reconnection: fetch missed notifications via `since` param (up to 50)
    - Collapse to summary indicator when >20 unread toasts
    - Update relevant dashboard sections (AttentionPanel, ActivityFeed, StatCards) on data-update events without full page reload
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [x] 4.8 Implement CommentThread UI in DashboardDrawer
    - Display Comment_Thread section below item details in existing DashboardDrawer
    - Show comments in chronological order with author name, relative timestamp, content
    - Input field with 1–2000 char validation; prevent submission of invalid content with validation message
    - Show success within 2 seconds of submission; display new comment in thread
    - Retain draft text on submission failure; show error message
    - Read-only mode (input disabled) for users without write access
    - Only visible to users with read access to parent item
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 4.9 Implement presence heartbeat client logic
    - Send heartbeat POST every 60 seconds while dashboard is open
    - Track user activity (mouse, keyboard, touch); stop heartbeat after 5 minutes of inactivity
    - Send disconnect action on page unload/close
    - _Requirements: 9.2, 9.3, 9.6_


- [x] 5. Phase 5: Personalization & Polish (Requirements 12–17)
  - [x] 5.1 Create `DashboardFilter` table schema and filter data functions
    - Add `DashboardFilter` table to `lib/db.ts` schema init (create table, then unique index with WHERE clause for SQLite/Postgres compatibility)
    - In `lib/data-dashboard.ts`, add functions: `getFilters(company, userId)`, `createFilter(company, userId, userName, name, project, activityScope, density, shared)`, `deleteFilter(company, userId, filterId)`, `checkFilterNameUnique(company, userId, name)`
    - Enforce max 20 filters per user; unique name per user+company
    - Call `logActivity()` on filter creation and deletion
    - _Requirements: 14.1, 14.2, 14.8, 16.7_

  - [x] 5.2 Create `GET /api/dashboard/filters` and `POST /api/dashboard/filters` and `DELETE /api/dashboard/filters/[id]` endpoints
    - Create `app/api/dashboard/filters/route.ts` for GET and POST
    - Create `app/api/dashboard/filters/[id]/route.ts` for DELETE
    - GET: return own filters first, then shared filters from same company
    - POST: validate name 1–50 chars, unique per user+company, max 20 per user; return 400 on violations
    - DELETE: soft-delete (set `deletedAt`); only owner can delete; return 403 otherwise
    - Enforce company-scoped isolation on all operations
    - _Requirements: 14.1, 14.2, 14.3, 14.5, 14.6, 14.8, 17.2, 17.3_

  - [x] 5.3 Create `GET /api/dashboard/digest` endpoint
    - Create `app/api/dashboard/digest/route.ts`
    - Query for: new bugs since user's last session, items assigned to user, status changes on user's items, upcoming sprint deadlines within 2 days
    - Max 10 items per section
    - Return `{ newBugs, assignedItems, statusChanges, upcomingDeadlines, hasData }` with `hasData: false` when all sections are empty
    - Enforce company-scoped isolation; timeout handling (5s max)
    - _Requirements: 12.1, 12.2, 12.4, 12.5, 17.2_

  - [x] 5.4 Implement DailyDigestCard UI component
    - Display at top of dashboard content area, above all other cards
    - Only show before 12:00 local time and when not dismissed today
    - Sections: new bugs, assigned items, status changes, upcoming deadlines (max 10 each)
    - Dismiss button stores dismissal in localStorage (keyed by date)
    - Do not show when `hasData` is false (zero relevant changes)
    - Error state with retry action; non-blocking (other dashboard content loads independently)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 5.5 Implement DensityToggle UI component
    - Add toggle in dashboard header: "Compact" / "Comfortable"
    - Compact: 8px padding, 12px font, 8px gap via CSS custom properties on dashboard container
    - Comfortable: 16px padding, 14px font, 16px gap (default)
    - Persist selection in localStorage; restore on page load
    - Apply layout change within 300ms without full page reload
    - Default to "Comfortable" when localStorage is unavailable or value is unreadable
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 5.6 Implement SavedFilters UI component
    - "Save Filter" action visible when project filter is active; name input 1–50 chars
    - Display filter chips below project filter control (own first, then shared, max 10 visible with "Show more")
    - Share toggle to make filter visible to company
    - Disabled chip state when referenced project no longer exists
    - Confirmation prompt before deleting a shared filter
    - Error message when duplicate name is attempted
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9_

  - [x] 5.7 Implement Micro-Animations for data updates
    - StatCard value change: scale 1→1.05→1 + opacity 0.7→1, 300ms ease-out
    - Attention item entry: slide-in-from-top, 200ms ease-out
    - Activity entry: fade-in opacity 0→1, 200ms ease-out
    - Use transform and opacity only (no layout shifts)
    - Respect `prefers-reduced-motion: reduce` - instant changes, no transitions
    - Animate each changed element independently and concurrently
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_


- [x] 6. Phase isolation and backward compatibility verification
  - [x] 6.1 Verify phase isolation - no forward references between phases
    - Ensure Phase 1 code does not import from Phases 2–5
    - Ensure Phase 2 code does not import from Phases 3–5
    - Ensure Phase 3 code has no shared module-level state with other phases
    - Ensure Phase 4 code does not import from Phase 5
    - Verify all database migrations are additive-only (new columns/tables, no alterations)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.7_

  - [x] 6.2 Verify backward compatibility and access control
    - Ensure all existing navigation routes resolve without 404
    - Verify company-scoped data isolation on all new API endpoints
    - Verify role-based access control on Quick_Actions, Comment_Thread, Saved_Filters
    - Confirm SQLite/Postgres compatibility with double-quoted camelCase columns and `isPostgres` branching
    - Run `pnpm precheck` to confirm zero type errors and zero build errors
    - _Requirements: 16.5, 16.6, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

## Notes

- Testing tasks have been removed per user request - testing will be handled manually
- Each task references specific requirements for traceability
- All SQL must use double-quoted camelCase columns per AGENTS.md rules
- All CRUD operations must call `logActivity()` per project conventions
- All queries must include company-scoped isolation
- Database changes must be additive-only and compatible with both SQLite and Postgres
- Use `isPostgres` flag from `lib/db.ts` for database-specific expressions

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6"] },
    { "id": 3, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 4, "tasks": ["2.4", "2.5", "2.6"] },
    { "id": 5, "tasks": ["3.1"] },
    { "id": 6, "tasks": ["4.1", "4.4"] },
    { "id": 7, "tasks": ["4.2", "4.3", "4.5"] },
    { "id": 8, "tasks": ["4.6", "4.7", "4.8", "4.9"] },
    { "id": 9, "tasks": ["5.1", "5.3"] },
    { "id": 10, "tasks": ["5.2", "5.4", "5.5"] },
    { "id": 11, "tasks": ["5.6", "5.7"] },
    { "id": 12, "tasks": ["6.1", "6.2"] }
  ]
}
```
