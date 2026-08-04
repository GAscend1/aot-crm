# AOT CRM — Development Roadmap & Session State

> **Resume instruction:** `freebuff --continue <session-id>` — the next session must
> continue automatically from **Phase 2 (CRM Simplification & Navigation)**.
> Do **not** repeat Phase 1. Project goals are recorded in this file and in the
> conversation history; do not ask the user to restate them.

## Checkpoint

- **Branch:** `feature/opportunity-workspace-redesign`
- **Last completed commit:** Phase 1 checkpoint (see `git log`)
- **Database:** Supabase PostgreSQL — schema up to date (12 migrations applied)
- **Verification at checkpoint (all green):**
  - `npx tsc --noEmit` — passes
  - `npm test` (vitest) — 16/16 pass
  - `npm run lint` — passes
  - `npm run build` — production build succeeds
  - `npx prisma migrate status` — "Database schema is up to date!"

---

## ✅ Phase 1: Workspace Modernization & Stability — COMPLETE

Delivered in this phase:

1. **Shared CRUD primitives** — replaced per-module `*Drawer` + `*DeleteDialog` components
   (24 files deleted) with `components/common/RecordModal.tsx`, `ConfirmDialog.tsx`,
   `FormError.tsx`, and `use-async-submit.ts`. Applied consistently across all modules:
   activities, administration, companies, contacts, customers, documents, invoices,
   leads, opportunities, quotes, reports, tickets. Forms now support async submit with
   loading/disabled states; delete is optimistic with rollback on failure.
2. **View-switcher architecture** — single-page modules with query-param views
   (`/activities?view=timeline|calendar|tasks|meetings|email`,
   `/opportunities?view=list|kanban|forecast`, `/contacts?view=...`, `/customers` merged
   into contacts). Legacy routes (`/activities/calendar`, `/activities/meetings`,
   `/activities/email`, `/inbox`, `/opportunities/kanban`) are preserved via
   `components/common/ViewSwitcher.tsx` + `ViewRedirect.tsx`.
3. **Activities "work engine"** — Timeline, Calendar, Tasks, Meetings, and Email views
   under `app/(app)/activities/views/` + `ActivitiesView.tsx` + `ActivityModal.tsx`.
4. **Opportunities workspace** — `OpportunitiesView`, `PipelineFiltersBar`,
   `OpportunityForecast`, kanban redirect; improved `OpportunityWorkspaceHeader`.
5. **Onboarding** — `hooks/use-onboarding.ts`, `components/onboarding/ProductTour.tsx`,
   `/api/onboarding/route.ts`, wired through `AppProviders` (includes `restartOnboarding`
   context). Migration `20260804065634_add_onboarding_and_lifecycle_stage`.
6. **Dashboard additions** — `OwnerPerformance`, `PipelineByStage`, `UpcomingMeetings`,
   `MetricStrip`; richer `/api/dashboard` and `/api/dashboard/revenue`.
7. **Stability** — `archived_at` lifecycle (`migration 20260804074306_add_archived_at`,
   API routes updated), `app/error.tsx` + `app/global-error.tsx`, `middleware.ts`
   renamed to `proxy.ts` (Proxy/Middleware in Next 16), vitest setup
   (`vitest.config.ts`, `tests/unit/modal-refactor.test.ts`,
   `tests/unit/navigation-active.test.ts`).

---

## Roadmap

### ⏳ Phase 2: CRM Simplification & Navigation *(NEXT — resume here)*

Goals: reduce cognitive load of the CRM; make navigation obvious and fast.

Current state to build on (already committed/Phase 1):
- `config/navigation.ts` already has grouped nav (`General / CRM / Sales /
  Communication / Support / Insights / Management`) with `hidden` items for merged
  modules and `findActiveItemHref()` (longest-prefix matching, unit-tested in
  `tests/unit/navigation-active.test.ts`).
- `AppSidebar.tsx` renders collapsible groups, active indicator, mobile drawer,
  localStorage-expanded groups, `data-tour` hooks.
- `CommandPalette.tsx` and keyboard shortcuts exist in `hooks/use-keyboard-shortcuts.ts`.

Suggested first steps:
1. Audit the sidebar: reduce visible top-level items (13 today) by consolidating
   (e.g., merge Quotes + Invoices under Sales as sub-items or a single "Billing"
   module; consider a "Customers 360" entry early).
2. Ensure every merged view (`?view=...`) surfaces correctly in the command palette
   and global search (`services/global-search.service.ts`).
3. Add breadcrumbs consistency pass (`components/enterprise/Breadcrumbs.tsx`) and
   mobile quick-nav (bottom tab bar for top 5 destinations).
4. Validate: typecheck, `npm test` (extends `navigation-active` tests), `npm run build`.

### Phase 3: Unified Sales Workspace (Opportunities + Pipeline)
- Deepen `OpportunitiesView`: merge kanban/funnel/forecast into one workspace.
- Stage-aware quick actions (move deal, change probability, set expected close).
- Win/loss reasons, deal health indicators.

### Phase 4: Contact/Company 360
- Unified customer profile merging Contacts + Companies + Customers + Documents.
- Activity timeline, open opportunities, tickets, and documents on one record page.
- 360 relationships (parent company, primary contact, related contacts).

### Phase 5: Unified Activity Center
- One inbox for emails, calls, meetings, tasks, reminders (build on Phase 1 views).
- Activity routing/assignment, follow-ups, snooze, bulk actions.
- Microsoft 365 + Teams + Zoom sync surfaced in one timeline.

### Phase 6: Analytics-First Dashboard
- KPIs, pipeline velocity, conversion funnels, revenue forecasts (build on Phase 1
  dashboard components). Owner performance, pipeline by stage, upcoming meetings/ tasks.
- Drill-downs into module pages; exportable report views.

### Phase 7: Performance Optimization
- Route-level code splitting, data prefetching, query caching (TanStack Query),
  image/font optimization, RSC migration where possible. Lighthouse budget.

### Phase 8: UX/UI Polish
- Design-system pass: spacing, typography, empty/loading/error states everywhere.
- Motion, micro-interactions, accessibility (WCAG AA) review, dark/light consistency.

### Phase 9: First-Time User Onboarding
- Build out `ProductTour` + `/onboarding` flow: role selection, sample data,
  guided first-record creation, contextual tips, notifications opt-in.

### Phase 10: Production QA & Release
- E2E test suite, integration tests (Microsoft Graph), security review, RBAC audit,
  load testing, Azure deployment verification, release notes.

---

## Notes for the resuming session

- **Do not re-verify Phase 1** beyond a quick `git status` + `npm run build` sanity
  check; jump straight into Phase 2 task 1.
- Run `git log --oneline -5` to confirm the Phase 1 checkpoint commit exists.
- If any of the Phase 1 verification gates fail on resume, treat that as a genuine
  blocker (per session policy) before starting Phase 2.
