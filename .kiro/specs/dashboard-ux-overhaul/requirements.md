# Requirements Document

## Introduction

A comprehensive UX overhaul of the QA Daily Hub dashboard, delivered across five independently deployable phases. The goal is to transform the dashboard from a passive data display into an actionable, real-time collaboration hub - improving information density, reducing navigation friction, and enabling team-wide situational awareness. The overhaul targets the existing Next.js 16.2 App Router codebase using Tailwind CSS v4 and Phosphor Icons, maintaining full backward compatibility with the current role-based access control system.

## Glossary

- **Dashboard**: The main landing page of QA Daily Hub (`/dashboard`) that displays aggregated metrics, activity, and attention items
- **Stat_Card**: A clickable card component displaying a single numeric metric with label, icon, and navigation link
- **Severity_Breakdown**: A sub-display within the bug Stat_Card showing counts per severity level (Critical, High, Medium, Low)
- **Resolution_Rate**: The ratio of resolved items to created items within a given time window, expressed as a percentage
- **Quality_Health_Score**: A composite metric (0–100) derived from resolution rate, bug severity distribution, and test pass rate
- **Attention_Panel**: The "Attention Needed" section listing critical bugs, priority tasks, and stuck items requiring immediate action
- **Quick_Action**: An inline button within an Attention_Panel item that performs a state change (assign, change status) without page navigation
- **Age_Indicator**: A visual label showing how many days an item has been in its current status
- **Activity_Feed**: The "Recent Activity" section displaying chronological team actions
- **Activity_Filter**: A toggle control switching the Activity_Feed between personal and team-wide views
- **Sidebar**: The left navigation panel containing grouped menu items with icons and labels
- **Presence_Indicator**: A real-time display showing which team members are currently online
- **Push_Notification**: A server-initiated message delivered via WebSocket or Server-Sent Events without client polling
- **Comment_Thread**: An inline discussion panel within the dashboard drawer for contextual collaboration
- **Daily_Digest_Card**: An auto-generated morning summary card showing overnight changes and priorities for the day
- **Density_Toggle**: A user preference control switching the dashboard layout between Compact and Comfortable spacing
- **Saved_Filter**: A named, shareable filter configuration that persists across sessions
- **Micro_Animation**: A subtle CSS/JS transition applied to data elements when values update

## Requirements

### Requirement 1: Severity Breakdown in Bug Stat Card

**User Story:** As a QA lead, I want to see a severity breakdown below the total bug count, so that I can instantly assess the risk profile without navigating to the bugs page.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Stat_Card for "Open Bugs" SHALL display sub-counts for Critical, High, Medium, and Low severity levels in that order below the total count, where each sub-count represents the number of open (non-closed, non-resolved) bugs of that severity
2. WHEN any severity sub-count is zero, THE Stat_Card SHALL still display that severity label with a value of 0
3. WHEN a user clicks a severity sub-count, THE Dashboard SHALL navigate to the bugs page filtered by that severity level
4. THE Dashboard API SHALL include a `bugSeverityCounts` object with integer-valued keys `critical`, `high`, `medium`, `low` in the response payload, where each value represents the count of open bugs for that severity
5. IF the Dashboard API response does not include `bugSeverityCounts` or the API request fails, THEN THE Stat_Card SHALL display the total open bug count without the severity breakdown and SHALL NOT display an error to the user
6. THE Stat_Card total open bug count SHALL equal the sum of the four severity sub-counts returned by the API

### Requirement 2: Resolution Rate Metric

**User Story:** As a project manager, I want to see the resolution rate in the weekly pulse section, so that I can gauge whether the team is keeping up with incoming work.

#### Acceptance Criteria

1. WHEN the "This Week Pulse" section renders, THE Dashboard SHALL display a Resolution_Rate metric calculated as (resolved / created) × 100, rounded to the nearest integer, followed by a "%" suffix
2. IF the created count for the current week is zero, THEN THE Dashboard SHALL display the Resolution_Rate as "N/A" instead of a numeric value
3. WHILE the Resolution_Rate is below 70%, THE Dashboard SHALL render the metric with a warning visual indicator (amber color)
4. WHILE the Resolution_Rate is at or above 70%, THE Dashboard SHALL render the metric with a healthy visual indicator (emerald color)
5. WHEN the "This Week Pulse" section renders, THE Dashboard SHALL display the Resolution_Rate change as a percentage-point delta calculated as (current week Resolution_Rate minus previous week Resolution_Rate), prefixed with "+" for positive values or "−" for negative values
6. IF the previous week created count is zero, THEN THE Dashboard SHALL omit the percentage-point delta display for the Resolution_Rate

### Requirement 3: Quality Health Score

**User Story:** As a QA lead, I want a single composite quality score, so that I can communicate overall project health to stakeholders in one number.

#### Acceptance Criteria

1. THE Dashboard SHALL compute a Quality_Health_Score as a weighted average: 40% resolution rate + 30% inverse critical bug ratio + 30% test pass rate, where resolution rate is (resolved / created) × 100 for the current week, inverse critical bug ratio is (1 − critical_bugs / total_open_bugs) × 100 (or 100 when total_open_bugs is zero), and test pass rate is (passed_tests / total_executed_tests) × 100 (or 0 when total_executed_tests is zero), with each component clamped to the range 0–100 before weighting
2. THE Dashboard SHALL display the Quality_Health_Score as an integer from 0 to 100, rounded down (floor), with a circular progress indicator
3. WHILE the Quality_Health_Score is below 50, THE Dashboard SHALL render the indicator in red
4. WHILE the Quality_Health_Score is between 50 and 74 inclusive, THE Dashboard SHALL render the indicator in amber
5. WHILE the Quality_Health_Score is at or above 75, THE Dashboard SHALL render the indicator in emerald
6. WHEN any input metric is unavailable because the underlying data source returns null or contains no records for the computation period, THE Dashboard SHALL use a default value of 0 for that component and display a tooltip on the indicator specifying which metric is incomplete
7. IF all three input metrics are unavailable, THEN THE Dashboard SHALL display the Quality_Health_Score as 0 and render a tooltip indicating that no data is available for score computation

### Requirement 4: Inline Quick Actions in Attention Panel

**User Story:** As a QA engineer, I want to assign or change the status of attention items directly from the dashboard, so that I can triage without navigating away.

#### Acceptance Criteria

1. WHEN a user hovers over or moves keyboard focus to an Attention_Panel item, THE Dashboard SHALL reveal Quick_Action buttons for "Assign" and "Change Status" within 100ms
2. WHEN a user clicks the "Assign" Quick_Action, THE Dashboard SHALL display a searchable dropdown listing up to 50 workspace members with assignable roles, and update the assignment upon selection
3. WHEN a user clicks the "Change Status" Quick_Action, THE Dashboard SHALL display a dropdown listing all status values defined for the item's module type (Task or Bug) and update the status upon selection
4. WHEN a Quick_Action completes successfully, THE Dashboard SHALL display a success toast notification and refresh the Attention_Panel data
5. IF a Quick_Action fails due to a network or server error, THEN THE Dashboard SHALL display an error toast indicating the failure reason and retain the item's assignment and status in their original state
6. IF the current user does not hold an admin or superadmin role, THEN THE Dashboard SHALL hide the Quick_Action buttons for that item
7. WHEN a user clicks outside an open Quick_Action dropdown or presses the Escape key, THE Dashboard SHALL close the dropdown without modifying the item

### Requirement 5: Age Indicator for All Attention Items

**User Story:** As a QA lead, I want to see how long every attention item has been in its current state, so that I can prioritize by staleness across all item types.

#### Acceptance Criteria

1. THE Attention_Panel SHALL display an Age_Indicator badge on every item showing the number of calendar days since the item entered its current status, formatted as the integer day count followed by "d" (e.g., "3d", "10d")
2. WHILE an item age is between 1 and 7 calendar days (inclusive), THE Age_Indicator SHALL render in the default slate color to signal normal staleness
3. WHILE an item age is greater than 7 calendar days and up to 14 calendar days, THE Age_Indicator SHALL render in amber to signal moderate staleness
4. WHILE an item age exceeds 14 calendar days, THE Age_Indicator SHALL render in red to signal critical staleness
5. IF an item age is less than 1 calendar day, THEN THE Age_Indicator SHALL display "Today" instead of a numeric day count
6. IF an item has no recorded status-change timestamp, THEN THE Age_Indicator SHALL display "-" and render in the default slate color

### Requirement 6: Activity Feed Filter Toggle

**User Story:** As a team member, I want to toggle between my own activity and the full team activity, so that I can focus on my work or get team-wide awareness.

#### Acceptance Criteria

1. THE Activity_Feed SHALL display a toggle control with exactly two options labeled "My Activity" and "Team Activity", where only one option can be active at a time
2. WHEN "My Activity" is selected, THE Activity_Feed SHALL display only activity entries where the creator matches the currently authenticated user, limited to the 50 most recent entries ordered by creation date descending
3. WHEN "Team Activity" is selected, THE Activity_Feed SHALL display activity entries from all team members within the current user's company scope, limited to the 50 most recent entries ordered by creation date descending
4. THE Activity_Feed SHALL default to "Team Activity" on initial load
5. WHEN the user switches the toggle, THE Activity_Feed SHALL update the displayed entries within 2 seconds without a full page reload, preserving the user's scroll position
6. IF the selected filter returns no activity entries, THEN THE Activity_Feed SHALL display an empty state message indicating no activity was found for the selected filter
7. WHILE the Activity_Feed is loading entries after a toggle switch, THE Activity_Feed SHALL display a loading indicator in place of the entry list

### Requirement 7: Collapsed Repetitive Activity Entries

**User Story:** As a dashboard user, I want repetitive activity entries grouped together, so that the feed remains scannable when bulk operations occur.

#### Acceptance Criteria

1. WHEN three or more activity entries share the same action, entityType, and summary-derived actor name within a rolling 5-minute window based on createdAt timestamps, THE Activity_Feed SHALL collapse them into a single summary entry regardless of whether other entries from different actors appear between them
2. THE collapsed entry SHALL display the total count of grouped entries, the action performed, the entity type, and the actor name in a format such as "[count] [entityType] [action] by [actor]"
3. WHEN a user clicks a collapsed entry, THE Activity_Feed SHALL expand inline to show all individual entries within that group ordered by createdAt descending
4. WHEN a user clicks an expanded group entry, THE Activity_Feed SHALL re-collapse it back to the single summary entry
5. THE Activity_Feed SHALL NOT collapse entries of different action types even if they share the same actor and time window
6. IF a collapsed group contains more than 50 entries, THEN THE Activity_Feed SHALL display the first 50 individual entries when expanded and indicate the total remaining count

### Requirement 8: Sidebar Navigation Restructure

**User Story:** As a platform user, I want the sidebar navigation grouped by workflow context, so that I can find related features faster.

#### Acceptance Criteria

1. THE Sidebar SHALL contain a "Work Tracking" group with items: Tasks, Bugs, Sprints - in that order, positioned as the third group after "Test Management"
2. THE Sidebar SHALL remove "Sprints" from the "Documentation" group, leaving "Documentation" with Meeting Notes only
3. THE Sidebar SHALL move "Deployment Log" from the "Documentation" group into the "Reports" group, placed after the existing Report item
4. THE Sidebar SHALL use icon weight "bold" and Title Case label casing for every navigation item across all groups
5. THE Sidebar restructure SHALL maintain all existing role-based visibility rules defined in the ROLE_MENU configuration, such that each role sees the same set of route hrefs before and after the restructure
6. WHEN a user navigates using the restructured Sidebar, THE application SHALL resolve all existing routes without 404 errors
7. THE Sidebar SHALL remove the "Defects & Tasks" group, with its former items (Bugs, Tasks) relocated to the "Work Tracking" group as specified in criterion 1
8. WHEN the Sidebar is rendered, THE Sidebar SHALL display groups in this order: (untitled Dashboard), Test Management, Work Tracking, Documentation, Reports, System Settings

### Requirement 9: Live Presence Indicator

**User Story:** As a team lead, I want to see which team members are currently online, so that I can coordinate in real time.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Presence_Indicator section showing avatars or initials of currently online team members, displaying up to 10 avatars individually and a "+N" overflow indicator when more than 10 members are online
2. WHEN a team member opens the dashboard, THE Presence_Indicator SHALL add that member within 5 seconds
3. WHEN a team member closes the dashboard or has no mouse, keyboard, or touch interaction for more than 5 minutes, THE Presence_Indicator SHALL remove that member within 10 seconds
4. THE Presence_Indicator SHALL display a count of online members alongside the avatar list
5. THE Presence_Indicator SHALL only show members within the same company scope
6. THE Presence_Indicator SHALL include the viewing user in the online members list
7. IF the presence service is unavailable, THEN THE Presence_Indicator SHALL display a message indicating that presence status is temporarily unavailable and hide the avatar list until the service recovers

### Requirement 10: Push-Based Notifications

**User Story:** As a QA engineer, I want to receive real-time notifications when items are assigned to me or statuses change, so that I can react immediately without refreshing.

#### Acceptance Criteria

1. THE Dashboard SHALL establish a persistent connection (WebSocket or Server-Sent Events) for receiving Push_Notifications upon successful user authentication
2. WHEN a bug or task is assigned to the current user, THE Dashboard SHALL display a toast notification within 3 seconds of the assignment, showing the item type, title, and assigner name
3. WHEN a critical bug is created in a project where the current user has an active role assignment, THE Dashboard SHALL display a toast notification within 3 seconds, showing the bug title and project name
4. IF the persistent connection drops, THEN THE Dashboard SHALL attempt reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s interval) up to a maximum of 10 attempts before stopping and displaying a connection-failed state
5. THE Dashboard SHALL display a connection status indicator in a fixed visible position showing one of three states: "connected", "reconnecting", or "disconnected"
6. WHEN a notification is received, THE Dashboard SHALL update the relevant dashboard section (Attention_Panel, Activity_Feed, or Stat_Cards) without a full page reload
7. WHEN the persistent connection is re-established after a disconnection, THE Dashboard SHALL retrieve and display any notifications that were generated during the disconnection period, up to a maximum of 50 missed notifications
8. IF the user has more than 20 unread toast notifications accumulated, THEN THE Dashboard SHALL collapse them into a summary indicator showing the total unread count rather than displaying individual toasts

### Requirement 11: Comment Thread in Dashboard Drawer

**User Story:** As a QA engineer, I want to add comments to items directly from the dashboard drawer, so that I can collaborate without navigating to the detail page.

#### Acceptance Criteria

1. WHEN a dashboard drawer is open for an item, THE Dashboard SHALL display a Comment_Thread section below the item details
2. WHEN a user submits a comment containing between 1 and 2000 characters (excluding leading/trailing whitespace), THE Dashboard SHALL persist the comment and display it in the thread within 2 seconds
3. THE Comment_Thread SHALL display comments in chronological order (oldest first) with author name, relative timestamp (e.g., "2 minutes ago"), and content
4. THE Comment_Thread SHALL only be visible to users who have read access to the parent item
5. IF comment submission fails, THEN THE Dashboard SHALL retain the draft text in the input field and display an error message indicating the reason for failure
6. IF a user submits a comment that is empty, contains only whitespace, or exceeds 2000 characters, THEN THE Dashboard SHALL prevent submission and display a validation message indicating the constraint
7. IF a user has read access but not write access to the parent item, THEN THE Dashboard SHALL display the Comment_Thread in read-only mode with the comment input disabled

### Requirement 12: Daily Digest Auto-Card

**User Story:** As a QA engineer starting my day, I want an auto-generated morning summary, so that I can quickly understand what happened overnight and what needs my attention today.

#### Acceptance Criteria

1. WHEN the Dashboard loads before 12:00 local time and the user has not dismissed the digest for today, THE Dashboard SHALL display a Daily_Digest_Card at the top of the content area, above all other cards and content sections
2. THE Daily_Digest_Card SHALL summarize the following sections, each showing a maximum of 10 items: new bugs created since the user's last authenticated session ended, items assigned to the user, status changes on items the user is assigned to or has created, and upcoming sprint deadlines within 2 calendar days
3. WHEN the user dismisses the Daily_Digest_Card, THE Dashboard SHALL hide the card and not display it again until 00:00 the following calendar day in the user's local timezone
4. IF there are zero changes relevant to the user since the user's last authenticated session ended, THEN THE Dashboard SHALL not display the Daily_Digest_Card
5. IF the Dashboard fails to retrieve digest data within 5 seconds, THEN THE Dashboard SHALL display the Daily_Digest_Card in an error state with a retry action, and SHALL not block the loading of other dashboard content

### Requirement 13: Dashboard Density Toggle

**User Story:** As a power user, I want to switch between compact and comfortable dashboard layouts, so that I can optimize screen real estate for my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Density_Toggle control in the dashboard header area with two mutually exclusive options: "Compact" and "Comfortable", with "Comfortable" selected by default on first visit when no stored preference exists
2. WHEN "Compact" is selected, THE Dashboard SHALL apply reduced card padding (8px), font sizes (12px body text), and element spacing (8px gap between cards) to all dashboard cards and widgets
3. WHEN "Comfortable" is selected, THE Dashboard SHALL apply standard card padding (16px), font sizes (14px body text), and element spacing (16px gap between cards) to all dashboard cards and widgets
4. THE Dashboard SHALL persist the selected density preference in local storage and restore it on subsequent page loads
5. WHEN the Density_Toggle selection changes, THE Dashboard SHALL apply the new layout within 300ms without triggering a full page reload
6. IF local storage is unavailable or the stored preference is unreadable, THEN THE Dashboard SHALL default to "Comfortable" mode without displaying an error to the user

### Requirement 14: Shared Saved Filters

**User Story:** As a team lead, I want to save and share dashboard filter configurations, so that the team can use consistent views.

#### Acceptance Criteria

1. WHEN a user applies a project filter, THE Dashboard SHALL display a "Save Filter" action that allows the user to name and save the current filter as a Saved_Filter with a name between 1 and 50 characters, unique per user within the same company scope
2. THE Dashboard SHALL persist Saved_Filters in the database associated with the user's company scope, and each user SHALL be limited to a maximum of 20 Saved_Filters
3. WHEN a user marks a Saved_Filter as "shared", THE Dashboard SHALL make the filter visible and selectable to all users within the same company
4. THE Dashboard SHALL display saved filters as quick-access chips below the project filter control, ordered with the user's own filters first followed by shared filters, showing a maximum of 10 chips with a "Show more" control if additional filters exist
5. WHEN a user selects to delete a Saved_Filter they own that is currently shared, THE Dashboard SHALL display a confirmation prompt indicating the filter will be removed for all team members before proceeding with deletion
6. WHEN the user confirms deletion of a Saved_Filter they own, THE Dashboard SHALL remove the filter record and it SHALL no longer appear for any user
7. THE Saved_Filter SHALL store the project name and any active toggle states (density, activity filter)
8. IF a user attempts to save a Saved_Filter with a name that already exists among their own filters, THEN THE Dashboard SHALL display an error message indicating the name is already in use and SHALL NOT create the duplicate filter
9. WHILE a Saved_Filter references a project that no longer exists, THE Dashboard SHALL display the filter chip in a disabled state and SHALL indicate that the referenced project is unavailable

### Requirement 15: Micro-Animations on Data Updates

**User Story:** As a dashboard user, I want subtle animations when data values change, so that I can notice updates without disruptive visual noise.

#### Acceptance Criteria

1. WHEN a Stat_Card value changes due to a data refresh, THE Dashboard SHALL apply a scale-and-fade animation to the updated value element, scaling from 1.0 to 1.05 and back to 1.0 while fading from opacity 0.7 to 1.0, with a total duration of 300ms and an ease-out timing function
2. WHEN a new item appears in the Attention_Panel, THE Dashboard SHALL animate the item entry with a slide-in-from-top transition that translates the element from its full height offset above its final position to its resting position, with a duration of 200ms and an ease-out timing function
3. WHEN an Activity_Feed entry is added, THE Dashboard SHALL animate the entry with a fade-in transition from opacity 0 to opacity 1, with a duration of 200ms and an ease-out timing function
4. WHILE the user's operating system has reduced-motion preference enabled (`prefers-reduced-motion: reduce`), THE Dashboard SHALL render all data updates with instant visual changes (duration 0ms) and no transform or opacity transitions
5. WHEN multiple data values update within the same data refresh cycle, THE Dashboard SHALL animate each changed element independently and concurrently without queuing or sequencing the animations
6. THE Micro_Animations SHALL not cause layout shifts (0px cumulative shift in surrounding elements) or reflow of adjacent content during playback, by using transform and opacity properties exclusively for animation

### Requirement 16: Independent Phase Deployment

**User Story:** As a platform owner, I want each phase to be independently deployable, so that I can ship incremental value without waiting for the full overhaul.

#### Acceptance Criteria

1. THE implementation SHALL organize changes such that Phase 1 (Stat Enhancement: Requirements 1–3) can be built and deployed without importing or referencing any code introduced by Phases 2–5
2. THE implementation SHALL organize changes such that Phase 2 (Attention & Activity Upgrade: Requirements 4–7) can be built and deployed after Phase 1 without importing or referencing any code introduced by Phases 3–5
3. THE implementation SHALL organize changes such that Phase 3 (Sidebar Restructure: Requirement 8) can be built and deployed independently of Phases 1, 2, 4, and 5 with no shared module-level state between Phase 3 code and other phase code
4. THE implementation SHALL organize changes such that Phase 4 (Real-Time & Collaboration: Requirements 9–11) can be built and deployed after Phase 1 and Phase 2 without importing or referencing any code introduced by Phase 5
5. IF a phase is deployed in isolation, THEN THE Dashboard SHALL pass a production build (`pnpm precheck`) with zero type errors and zero build errors, render the `/dashboard` route without console errors, and maintain all navigation routes returning HTTP 200
6. IF a phase is deployed without its successor phases, THEN THE Dashboard SHALL render all pre-existing Stat_Cards, Attention_Panel, Activity_Feed, and Sidebar navigation items with their current behavior unchanged
7. IF a phase introduces a database schema change, THEN THE implementation SHALL use additive-only migrations (new columns or tables) that do not alter or remove columns used by other phases

### Requirement 17: Backward Compatibility and Access Control

**User Story:** As a platform owner, I want the overhaul to preserve all existing functionality and respect role-based access, so that no user workflow is broken.

#### Acceptance Criteria

1. THE Dashboard SHALL maintain all existing navigation routes defined in the App Router without introducing 404 errors for any previously accessible path
2. THE Dashboard SHALL continue to enforce company-scoped data isolation for all new features such that API responses and UI views return only data matching the authenticated user's company value
3. THE Quick_Actions, Comment_Thread, and Saved_Filters SHALL enforce the existing role-based permission model (superadmin, admin, qa, pm, fe, be, fullstack, ai roles) by restricting access to authorized roles and returning an unauthorized error response to users without sufficient permissions
4. THE Dashboard SHALL maintain compatibility with both SQLite (development) and Neon Postgres (production) databases using double-quoted camelCase columns and branching database-specific expressions via the isPostgres flag
5. IF a new feature requires a database schema change, THEN THE implementation SHALL use additive migrations (adding columns, tables, or indexes only) that do not remove, rename, or alter the type of existing columns or tables
6. IF a user without a management role (superadmin or admin) attempts to access an admin-restricted feature in Quick_Actions, Comment_Thread, or Saved_Filters, THEN THE Dashboard SHALL deny the action and display an error message indicating insufficient permissions within 1 second of the request
