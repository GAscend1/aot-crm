# AOT CRM — Development Roadmap & Session State

> **Resume instruction:** `freebuff --continue <session-id>` — the next session must
> continue automatically from a **post-Phase-11 + post-audit state** (all roadmap
> phases 1–11 are complete; see the audit section below).
> Do **not** repeat Phases 1–11. Project goals are recorded in this file and in the
> conversation history; do not ask the user to restate them.

## Checkpoint

- **Branch:** `feature/opportunity-workspace-redesign`
- **Last completed commit:** Phase 1 checkpoint (see `git log`; Phases 2–11 are uncommitted working-tree changes)
- **Database:** Supabase PostgreSQL — schema up to date (20 migrations applied)
- **Verification at checkpoint (all green):**
  - `npx tsc --noEmit` — passes
  - `npm test` (vitest) — 71/71 pass (incl. RBAC audit + entitlements suites)
  - `npm run lint` — passes
  - `npm run build` — production build succeeds (bundle budget gate)
  - `npm run audit:security` — no blocking findings
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

## ✅ Phase 2: CRM Simplification & Navigation — COMPLETE

Delivered in this phase (resumed from Phase 1 checkpoint `65228c0`):

1. **Simplified navigation** — `config/navigation.ts` restructured to the target
   structure: **General** (Dashboard) / **CRM** (Companies, Contacts) /
   **Sales** (Opportunities, Quotes, Invoices) / **Work** (Activities, Tickets) /
   **Documents** / **Reports** / **Administration**. Visible items reduced from
   13 → 11. `Customers`, `Leads`, `Inbox`, and `Files` remain in config as
   `hidden` (deep links + command palette + active-state contract preserved).
2. **Leads merged into Contacts** — Contacts module now hosts
   People / Customers / Leads views (`ContactsView`). Legacy `/leads` redirects
   to `/contacts?view=leads` (params preserved); `/leads/[id]` detail pages keep
   working. `LeadTable`/`CustomerTable` row clicks now navigate directly to the
   merged workspace URL (no redirect bounce).
3. **Files merged into Documents** — new `DocumentsView` hosts Documents / Files
   views; the file manager was extracted into reusable `FileManagerView`;
   legacy `/files` redirects to `/documents?view=files`.
4. **Mobile quick-nav** — new `MobileTabBar` (bottom tab bar, top 5
   destinations, active-state aware) wired into `AppShell` with safe-area
   padding.
5. **View-aware breadcrumbs** — `Breadcrumbs` now appends the active `?view=`
   label (e.g. Contacts → Customers), Suspense-wrapped in `AppNavbar`.
6. **Command palette & onboarding sync** — Quotes/Invoices/File Manager entries
   added; Customers/Leads quick actions point at merged views; `ProductTour`
   leads step no longer targets a hidden nav item.
7. **Tests** — `navigation-active.test.ts` extended with a Phase 2 structure
   contract (groups, hidden items, visible set).

Verification at checkpoint (all green):
- `npx tsc --noEmit` — passes
- `npm test` (vitest) — 23/23 pass
- `npm run lint` — passes
- `npm run build` — production build succeeds (all legacy routes preserved)

---

## Roadmap

### ✅ Phase 3: Unified Sales Workspace — COMPLETE

Delivered in this phase (also included the Microsoft Graph audit + runtime
integration detection and profile resilience workstreams from the resume brief):

**Sales workspace:**
1. **Win/loss tracking** — `Opportunity` gained `wonReason`, `lostReason`,
   `closedAt` (migration `20260806002728_phase3_win_loss_tracking`); validation,
   API (POST/PATCH + stage-move safety net that auto-closes deals), and service
   types updated.
2. **Deal health indicators** — new `lib/deal-health.ts` (composite score from
   probability / expected-close recency / staleness) surfaced as badges on kanban
   cards and in the workspace inspector.
3. **Stage-aware quick actions** — `DealQuickUpdateDialog` (probability,
   expected close, Mark as Won / Lost with reason) wired into a per-card kanban
   overflow menu (`KanbanBoard.renderCardMenu`) and the workspace header overflow
   menu. Compact card density + narrower columns reduce scrolling.

**Microsoft Graph audit (fake-pending removal):**
4. `services/integration-gate.ts` rewritten — the fake "awaiting administrator
   approval" logic is gone, replaced by real runtime states: `CONNECTED`,
   `SIGN_IN_REQUIRED`, `RECONSENT_REQUIRED`, `TOKEN_EXPIRED`,
   `CONFIGURATION_ERROR`, `GRAPH_UNAVAILABLE` (`classifyGraphError` on the client;
   `detectIntegrationState` on the server).
5. `auth.ts` now requests the full granted delegated scope set (incl.
   `Calendars.ReadWrite`, `Mail.ReadWrite`, `Mail.Send`, `OnlineMeetings.ReadWrite`,
   `Presence.Read`) and routes errors to a real `/auth/error` page; the fake
   `/auth/admin-approval-required` page was deleted.
6. Status endpoint (`/api/integrations/microsoft/status`) computes state from env
   config + JWT (token expiry, consent errors) + a short `/me` reachability probe.
7. Calendar / Meetings / Email / EmailTimeline views replaced string-matched
   "pending approval" banners with the shared `IntegrationStateBanner`
   (reconnect/retry UI, non-blocking). `graphSyncStatus` default changed from
   `PENDING_CONSENT` → `NOT_SYNCED` (migration `20260806003842_calendar_sync_status_default`).

**Profile:**
8. `/profile` always loads — CRM-first (`/api/users/me` + session) with Microsoft
   Graph enrichment loaded asynchronously (loading / retry / fallback; Graph
   failures never block rendering).
9. Navbar avatar menu cleaned up (View Profile, Appearance, Sign Out → `/login`;
   duplicate placeholder items removed).

Verification (all green):
- `npx tsc --noEmit` — passes
- `npm test` (vitest) — 23/23 pass
- `npm run lint` — passes
- `npm run build` — production build succeeds
- `prisma migrate status` — 14 migrations, up to date

**Remaining work (deferred, tracked below):** bidirectional Outlook calendar sync
persistence (Graph event ID, delta/webhook sync, attendee+timezone persistence),
which belongs with Phase 5's unified activity sync engine.

---

### ✅ Phase 4: Contact/Company 360 — COMPLETE

Delivered in this phase (resumed from the Phase 3 checkpoint):

**Schema & API:**
1. **Schema** — `Activity.companyId` relation (activities link to companies and
   surface on both Company and Contact timelines) + `Contact.role` field for
   buyer-persona roles (migration `20260806010644_phase4_company360`).
2. **Aggregation endpoints** — `/api/companies/[id]/overview` and
   `/api/contacts/[id]/overview` fetch a record's full context in parallel:
   company/contact, metrics, contacts/teammates, customers, opportunities,
   documents, tickets, activities, upcoming meetings, open tasks, and audit
   events. Metrics use real `count()`/`aggregate()` queries (not capped list
   lengths).
3. **Generic upload route** — `/api/documents/upload` links a file to any
   entity (company/customer/opportunity/lead), stores it via
   `DocumentStorage`, and writes an audit + activity timeline entry that is
   linked to the target entity.
4. **Contact role updates** — `contactSchema` + `PATCH /api/contacts/[id]`
   accept `role`; `activityToUI` exposes `companyId`; activities API filters
   by company (direct OR via linked customer).

**UI building blocks (new, shared):**
5. `EntityTabs` (accessible, keyboard-navigable tab bar), `EntityTimeline` +
   `buildEntityTimeline` (merged activity + document + audit feed), `CompanyHealth`
   + `computeCompanyHealth`, `RelationshipGraph` (SVG hub layout),
   `EntityUpcomingWidgets` (Upcoming Meetings / Open Tasks), `AddTaskDialog`,
   `UploadEntityDocumentDialog`, `RelatedDocumentsList`.
6. `lib/stage-pills.ts` — pipeline stage pill classes moved to `lib/`
   (`lib/pipeline-stages.ts`) with the opportunities module re-exporting for
   backward compatibility.

**Pages (rebuilt):**
7. **`/companies/[id]` 360** — header (health badge, quick actions), tabs
   (Overview / Contacts / Opportunities / Activities / Meetings / Emails /
   Documents / Timeline), metric strip, health summary, relationship graph,
   upcoming meetings, open tasks, recent interactions.
8. **`/contacts/[id]` 360** — header (role chip, quick actions), tabs
   (Profile / Company / Deals / Meetings / Tasks / Emails / Documents /
   Timeline), inline role selector (PATCH), contact details, teammate grid,
   deals with stage pills, meeting/task widgets, email + document history.

Verification (all green):
- `npx tsc --noEmit` — passes
- `npm test` (vitest) — 23/23 pass
- `npm run lint` — passes
- `npm run build` — production build succeeds
- `prisma migrate status` — 15 migrations, up to date

---

### ✅ Phase 5: Unified Activity Center — COMPLETE

Delivered in this phase — the unified activity **sync engine** with local-first
Microsoft Graph calendar synchronization:

**Schema & persistence (2 migrations):**
1. `20260806020000_phase5_calendar_sync` — `CalendarEvent` gained the full Graph
   sync state: `graphEventId` (unique — duplicate prevention + bidirectional
   matching), `changeKey` (upstream-edit detection), `timeZone`, `attendees` +
   `organizer` (JSON round-trip), `onlineMeetingUrl`, `lastSyncedAt`,
   `syncError`, `syncAttempts`. New `CalendarSyncJob` retry queue (status,
   attempts, maxAttempts, backoff `nextAttemptAt`, lastError) and
   `CalendarDeltaState` (per-user `deltaLink` cursor + `lastSyncAt`).
2. `20260806021000_webhook_subscription` — `WebhookSubscription` persists
   Graph change-notification subscriptions per user + resource.
3. `20260806030000_graph_token` — `GraphToken` stores an encrypted per-user
   Microsoft refresh token so background/webhook workers (no browser session)
   can resolve access tokens; written/rotated by the Auth.js jwt callback.

**Sync engine (`services/calendar-sync.service.ts`):**
4. **Push (CRM → Outlook)** — `pushEventToGraph`/`deleteEventFromGraph`
   create/update/delete events on Graph with timezone + attendee round-trip
   (`buildGraphPayload`, unit-tested); 404/410 upstream clears the stale link
   so retries recreate.
5. **Pull (Outlook → CRM)** — delta sync via per-user delta cursor
   (`pullCalendarDelta`); dedupe by unique `graphEventId`, skip-on-unchanged
   via `changeKey`, `@removed` deletions mark local events DELETED, and **410
   Gone recovery** clears the expired cursor and falls back to a full resync.
6. **Retry queue** — `enqueueSyncJob` (create jobs auto-upgrade to update when
   a graphEventId already exists → no duplicate Outlook events), exponential
   backoff (15m × attempts, capped), max-attempts terminal `failed` state,
   `processSyncQueue` resets attempts on success.
7. **Orchestration** — `runCalendarSync` (pull + flush queue) and
   `runCalendarSyncForUser` (resolves per-user token from the at-rest store for
   session-less workers).

**API layer (all persist-first; Graph failures never block the CRM):**
8. `GET/POST /api/calendar/events` + `GET/PATCH/DELETE /api/calendar/events/[id]`
   — local persistence with async Graph push and job enqueue on failure.
9. `POST /api/calendar/sync` (manual delta pull + retry flush, returns status)
   + `GET /api/calendar/sync` status + `/api/calendar/sync/background` worker
   (CRON_SECRET-guarded, processes the queue for all users with a delta cursor).
10. Webhook receive route — `validationToken` handshake (text/plain), **strict
    `clientState` gate**, lifecycle-notification ack, subscriptionId → owner
    mapping, fire-and-forget per-user delta sync. Subscription lifecycle route
    (create/renew/delete) with 48h expiry and public-URL detection.

**At-rest token security:**
11. `lib/server/token-crypto.ts` — AES-256-GCM encryption keyed off
    `AUTH_SECRET` (no new secrets to provision); `lib/server/graph-tokens.ts`
    persists/rotates/clears the encrypted refresh token from the Auth.js jwt
    callback (fire-and-forget, never blocks auth). Tamper + round-trip tests.

**Client:**
12. `services/calendar.service.ts` rewired to the local API; `CalendarView`
    gained a sync status bar (last-synced, pending retries, error count), a
    Sync Now button, background sync on mount, and per-event sync badges;
    `EventModal` passes entity links (lead/customer/opportunity) and shows
    sync state in the details view.

Verification (all green):
- `npx tsc --noEmit` — passes
- `npm test` (vitest) — 35/35 pass (incl. new calendar-sync-payload + token-crypto suites)
- `npm run lint` — passes
- `npm run build` — production build succeeds
- `prisma migrate status` — 18 migrations, up to date

---

### ✅ Phase 6: Analytics-First Dashboard — COMPLETE

Delivered in this phase — KPIs, pipeline velocity, conversion funnel, revenue
forecast, win/loss analytics, team productivity, customer health, drill-downs,
and exportable report views.

**Reusable analytics core (pure, unit-tested):**
1. `lib/analytics.ts` — dependency-free helpers: `buildForecastSeries`
   (committed ≥80% / probability-weighted / best-case monthly buckets),
   `averageCycleDays` (won deals, closedAt − createdAt), `computeVelocity`
   (weighted pipeline ÷ cycle days), `buildWinRateTrend` (monthly close ratio),
   `breakdownByReason` (won/lost reason grouping), `buildTeamProductivity`
   (per-owner won value, win rate, activity mix).
2. `lib/company-health.ts` — `computeCompanyHealth` extracted from the
   `CompanyHealth` component (now pure, server-safe; component re-exports for
   backward compatibility).
3. `lib/server/health-snapshot.ts` — cross-company health aggregation with
   parallel `groupBy`/relation queries (contacts, open/won opportunities, open
   tickets, recent activities) → health distribution + at-risk/top companies.
   Real open-opportunity **counts** (not value-boolean proxies) feed the score.

**API extensions:**
4. `GET /api/reports` now returns `velocity` (avg cycle days, $/day, deals
   moved per stage), `forecast` (6-month committed/weighted/best series),
   `winLoss` (won/lost by reason, win-rate trend, won/lost value),
   `teamProductivity` (per-owner rollup incl. tasks/meetings/calls/emails),
   and `customerHealth` (distribution + company lists).
5. `GET /api/dashboard` now returns a 3-month `forecast` + `customerHealth`
   snapshot for the home page.

**UI:**
6. `/reports` (Sales Analytics hub) gained a 4th KPI row (Forecast committed /
   weighted, Pipeline Velocity $/day, Avg Sales Cycle) plus five new sections:
   Revenue Forecast (stacked committed/weighted + best-case overlay), Pipeline
   Velocity, Won/Lost by Reason + Win Rate Trend, Team Productivity (chart +
   activity-mix table), and Customer Health (donut + clickable company cards).
   Every new chart has a **drill-down** to the relevant module page
   (`/opportunities?view=forecast|list`, `/companies`, `/companies/[id]`) and
   per-chart **CSV export**; the header export now downloads a full multi-
   section CSV report.
7. `/dashboard` gained `RevenueForecast` (weighted next-3-month bars) and
   `CustomerHealthSnapshot` (distribution + top companies) widgets in the
   analytics row alongside `PipelineByStage`.

Verification (all green):
- `npx tsc --noEmit` — passes
- `npm test` (vitest) — 48/48 pass (new `tests/unit/analytics.test.ts`, 13 tests)
- `npm run lint` — passes
- `npm run build` — production build succeeds
- No schema changes (18 migrations, up to date)

---

### ✅ Phase 7: Performance Optimization — COMPLETE

Delivered in this phase — TanStack Query caching (dedupe + invalidation), SSR
prefetch, route-level code splitting, image/font optimization (already on
`next/font`), RSC migration where possible, and a build-gated Lighthouse bundle
budget.

**Query caching (TanStack Query v5 — was installed, never wired):**
1. `providers/index.tsx` now wraps the app in `QueryClientProvider` with
   deliberate defaults (30s stale, 5m gc, no window-focus refetch storm,
   single retry).
2. `use-dashboard-data.tsx` rewritten as a `DashboardDataProvider` context
   provider on a single `useQuery` — the dashboard's 9 widgets previously
   mounted **9 independent 30s pollers of /api/dashboard**; now they share one
   query (plus cache invalidation). Old `.ts` hook deleted.
3. `use-api-list.ts` rewritten on `useQuery` with `["api-list", path]` keys —
   the ~12 module stats components that each fetch `?pageSize=1000` dedupe
   into one request per path.
4. `use-reports-data.ts` rewritten on `useQuery` with filter-keyed keys —
   switching report ranges is instant (per-filter cache), 60s staleness.
5. `components/enterprise/QueryCacheBridge.tsx` — entity mutation/status
   events invalidate the `api-list` / `dashboard` / `reports` caches
   (scoped to CRUD events; high-frequency ambient events like notifications
   are excluded so a busy dashboard isn't refetched on every tick).

**SSR prefetch + RSC migration:**
6. `lib/server/dashboard-data.ts` — the full `/api/dashboard` aggregation
   extracted into one `getDashboardData()` source of truth (typed via the new
   neutral `lib/types/dashboard.ts`); the API route is now a thin wrapper and
   the `/dashboard` page is an RSC that **prefetches on the server and
   hydrates** the client provider (instant first paint, then one client poll).

**Route-level code splitting:**
7. `CommandPalette`, `QuickCreate`, and `ProductTour` are lazy-loaded via
   `next/dynamic({ ssr: false })` in `AppProviders` — modal surfaces only load
   when opened.
8. The recharts-based `PipelineByStage` dashboard card is split behind a
   client `LazyPipelineByStage` boundary (recharts stays out of the dashboard
   initial chunk; skeleton fallback while loading).

**Image/font optimization & Lighthouse budget:**
9. Fonts were already served via `next/font/google` (Geist) with variable
   subsets; image usage audited (all `next/image`, no raw `<img>`).
10. Next 16 builds with Turbopack (no webpack `performance`), so the budget is
    enforced by a post-build gate: `scripts/check-bundle-budget.mjs` walks
    `.next/static/chunks`, reports raw + gzip sizes, and **fails the build** if
    any chunk exceeds the 512 KB budget. Wired into `npm run build`. Current
    largest chunk: 353 KB raw / 103 KB gz (within budget).

Verification (all green):
- `npx tsc --noEmit` — passes
- `npm test` (vitest) — 52/52 pass (new `tests/unit/client-api.test.ts`)
- `npm run lint` — passes
- `npm run build` — production build succeeds; `[bundle-budget] OK — 108 chunks`
- No schema changes (18 migrations, up to date)

---

### ✅ Phase 8: UX/UI Polish — COMPLETE

Delivered in this phase — a design-token consistency, dark/light parity, and
accessibility/motion pass across the app shell, dashboard, overlays, and modules.

**Dark/light consistency (hardcoded colors → design tokens):**
1. **Dashboard modules** — all 12 `modules/dashboard/components/*` widgets
   migrated from hardcoded `slate-*`/`bg-white`/`text-slate-*` classes to design
   tokens (`text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`,
   `bg-surface-raised`) with semantic soft tones (`success-soft`, `warning-soft`,
   `danger-soft`, `info-soft`, `primary-soft`) for status pills and icons.
2. **Enterprise overlays** — `CommandPalette`, `QuickCreate`, and `FilePreview`
   now use `bg-popover` (was `bg-white dark:bg-slate-950`), token text colors, and
   `primary-soft` selection/highlight states.
3. **Tables & detail lists** — `DataTableToolbar` and `DataTableBulkActions`
   surfaced as `bg-surface-raised`; `RelatedEntityLists` quote/invoice/stage
   pill maps + `Timeline` action colors migrated to semantic soft tokens
   (entity colors resolved via `--color-quote-soft` / `--color-activity-soft`
   arbitrary values scoped to `.aot-app`).
4. **Integration dialogs** — `EventModal`, `EmailComposer`, `ZoomMeetingDialog`,
   `TeamsMeetingDialog` field labels moved to `text-muted-foreground`;
   `NotificationCenter` badge uses the `--danger` token.
5. **Leads module** — `ConvertLeadDialog`, `AssignLeadDialog`, `ActivityComposer`,
   `LeadActivitiesTab`, `LeadDocumentsTab`, `LeadHistoryTab`, `LeadRemindersTab`
   migrated from `bg-white dark:bg-slate-950`, `focus:border-blue-400`, and
   `text-slate-*` to token surfaces, focus rings, and semantic soft icons.

**Loading state consistency:**
6. All raw `bg-slate-200 dark:bg-slate-800` / `bg-slate-100` skeleton blocks in
   the opportunity/quote/invoice/lead/customer detail pages, the reports loading
   page, and the leads tab components now use the `bg-muted` token (dark-mode
   correct via the theme system).

**Motion & accessibility (WCAG AA):**
7. `providers/index.tsx` wraps the app in `MotionConfig reducedMotion="user"` —
   framer-motion timelines/animations now respect the OS `prefers-reduced-motion`
   setting (CSS animations were already gated in `globals.css`).
8. Added missing `focus-visible:ring` states to `QuickActions` links,
   `RevenueChart` view toggle, `FilePreview` download, `CommandPalette` items,
   `QuickCreate` actions, and the leads reminder/activity toggle buttons.

Verification (all green):
- `npx tsc --noEmit` — passes
- `npm test` (vitest) — 52/52 pass
- `npm run lint` — passes
- `npm run build` — production build succeeds; `[bundle-budget] OK — 108 chunks`
- No schema changes (18 migrations, up to date)

---

### ✅ Phase 9: First-Time User Onboarding — COMPLETE

Delivered in this phase — a full onboarding wizard at `/onboarding` plus the
API and dashboard plumbing behind it.

1. **`/onboarding` wizard page** — `app/(app)/onboarding/page.tsx` + new
   `components/onboarding/OnboardingWizard.tsx`: a 4-step flow (Role → Sample
   data → Notifications → Done) with progress bar, framer-motion transitions
   (respecting `prefers-reduced-motion` via `useReducedMotion`), keyboard/
   focus-visible states, and skip-for-now affordance. Role step offers 6 roles
   (Sales Manager / Sales Rep / Support Manager / Support Agent / HR Manager /
   Viewer); sample-data step calls the idempotent seeder; notifications step
   persists an opt-in flag.
2. **Self-service role selection** — `PATCH /api/users/me` (new) accepts a
   whitelisted `role` (validated against `config/roles.ts` values) so the
   wizard can set the user's role without an admin; `GET` unchanged.
3. **Idempotent sample-data seeder** — `POST /api/onboarding/sample-data`
   creates 4 companies, 5 customers, 6 contacts, 5 opportunities across all 6
   pipeline stages (upserted idempotently), and 5 activities — all linked to
   the current user. Refuses to run when the workspace already has companies
   (no duplicate rows on retry); writes an audit event.
4. **Notification opt-in** — `useSyncedNotifications` now respects a
   `aot-notifications-enabled` localStorage preference and reacts to the
   `aot:notifications-pref-change` custom event (re-mounts the polling loop).
5. **Welcome modal → wizard** — `ProductTour` welcome dialog gained a "Set up
   my workspace" primary action linking to `/onboarding`; completing the wizard
   dispatches `aot:onboarding-complete` and marks the user's onboarding state
   via `PATCH /api/onboarding`.
6. **Getting Started widget** — new `modules/dashboard/components/GettingStarted.tsx`
   (dismissible checklist: choose role → load sample data → connect Outlook →
   take the tour) wired into the dashboard row for new/partially-onboarded users.

---

### ✅ Phase 10: Production QA & Release — COMPLETE

Delivered in this phase — a QA/security/release toolchain and documentation.

1. **RBAC audit (unit test, guards the invariant)** — new
   `tests/unit/rbac-audit.test.ts` statically scans every `app/api/**/route.ts`
   and asserts each route handler references an auth guard (`getCrmUser` /
   `requireUser` / session). Intentional public routes (NextAuth catch-all,
   Graph webhook, Microsoft status probe, Zoom stub, cron sync worker) are
   explicitly allowlisted with reasons. **Audit drove two real fixes:**
   `/api/dashboard` and `/api/dashboard/revenue` were exposing company-wide
   KPIs/revenue unauthenticated — both now call `getCrmUser()` + `unauthorized()`.
2. **API smoke E2E suite** — `tests/e2e/api-smoke.test.ts` (new, excluded from
   the default unit run): probes `http://localhost:3000`, then smoke-tests the
   public health/marketing surface (no auth required); skips gracefully when no
   server is running. `tests/e2e/README.md` documents `npm run test:e2e` and the
   pre-requisites.
3. **Security audit script** — `scripts/security-audit.mjs` (npm
   `audit:security`): scans for hardcoded secrets, `dangerouslySetInnerHTML` /
   `innerHTML` (XSS), client components referencing `process.env.*` secrets,
   and `target="_blank"` anchors missing `rel="noopener noreferrer"` (now
   scans the full `<a>` tag so multi-line JSX attributes don't false-positive).
   Exits non-zero on blocking findings — wired as a release gate.
4. **Load test script** — `scripts/load-test.mjs` (npm `loadtest`): drives a
   configurable QPS burst at any route (defaults to `/api/companies` with an
   auth cookie optional) and reports latency percentiles + error rate.
5. **npm scripts** — added `test:e2e`, `audit:security`, and `loadtest`.
6. **Release documentation** — new `RELEASE_NOTES.md` (v0.1.0 — what shipped
   across Phases 1–10, verified gates, known limitations) and `DEPLOYMENT.md`
   (Azure App Service + Supabase checklist: env vars, Microsoft Entra app
   registration, cron/webhook configuration, bundle budget, security gates).

---

## Post-Phase-10 Maintenance — QueryClient runtime failure (FIXED)

Symptom: `No QueryClient set, use QueryClientProvider to set one` thrown by
`QueryCacheBridge` on localhost after login.

**Root cause:** stale Turbopack dev cache from an interrupted session. The
`providers.tsx` → `providers/index.tsx` move (Phase 7) happened while the dev
server held a module graph in which the dashboard route chunk
(`[root-of-the-server]__0-y6t39._.js`, 12:25) referenced the *old* providers
module (no `QueryClientProvider`) while `AppProviders.tsx` had already been
recompiled with `QueryCacheBridge` (13:23). `useQueryClient()` then found no
provider. Source architecture was correct; the compiled output was not.

**Fix (architectural hardening, not just cache clear):**
1. `providers/index.tsx` now renders `<QueryCacheBridge />` as a **direct child
   of `QueryClientProvider`** — the invariant is structural (single QueryClient;
   bridge always inside the provider), instead of depending on which layout
   mounts the app shell. It also mounts on public pages, which is harmless
   (no entity mutations fire there, so invalidations are no-ops).
2. `app/(app)/AppProviders.tsx` — removed the `QueryCacheBridge` render/import.
3. New `tests/unit/query-client-provider.test.ts` — static regression guard
   (same style as `rbac-audit.test.ts`): exactly one `new QueryClient`, exactly
   one `<QueryClientProvider`, and `QueryCacheBridge` may only be rendered by
   `providers/index.tsx`. A future regression is caught by `npm test`.
4. Cleared the stale `.next` cache and rebuilt.

Verification (all green):
- `npx tsc --noEmit` — passes
- `npm test` (vitest) — 60/60 pass (8 files, incl. new query-client-provider suite)
- `npm run lint` — passes
- `npm run build` — production build succeeds; `[bundle-budget] OK — 110 chunks`
- Dev server smoke: `/login` + `/` return 200; dashboard route compiles with
  `QueryCacheBridge` + `QueryClientProvider` in the same SSR chunk graph.

---

## ✅ Phase 11: SaaS Multi-tenancy & Subscriptions — COMPLETE

Delivered in this phase — the CRM became a multi-tenant SaaS product with plans,
entitlements, trials, platform administration, and a public sales funnel.

**Schema & tenancy (migration `20260807000000_saas_multitenancy`, applied):**
1. `Organization` (keyed by the authenticated Microsoft Entra `tid` — never by
   email domain), `OrganizationMember`, `Plan`, `Entitlement`, `Subscription`,
   `SubscriptionChange` (full access audit), `OnboardingState`, `SalesInquiry`.
2. `organizationId` added to every tenant-owned table (backfilled into the
   default workspace org, then NOT NULL) — all ~40 API route files now scope
   every query/write with `organizationId` server-side.
3. `auth.ts` now resolves the tenant id from the id_token; new users get an
   isolated Organization + automatic 14-day Trial on first login
   (`lib/server/tenant.ts` → `resolveOrganizationForSession`).

**Plans & entitlements (`lib/entitlements.ts` — pure, unit-tested):**
4. Four plans: TRIAL / STARTER / PROFESSIONAL / ENTERPRISE with layered feature
   inheritance. **TRIAL is a useful evaluation, not read-only**: Companies,
   Contacts, Leads, Opportunities (+ Kanban), Tasks, and basic Activities.
   **TRIAL excludes**: Quotes, Invoices, Reports/saved reports, Advanced
   Analytics, Automation, API access, Outlook Email, Calendar Sync, Teams,
   and enterprise integrations. Unknown/missing plan codes grant NOTHING
   (fail closed).
5. `featurePlan()`/`featurePlanLabel()` map each feature to its lowest granting
   plan for locked-state UI copy ("Available on Starter").

**Server-side enforcement (never UI-only):**
6. `featureGate(user, feature)` helper — returns 403 `FEATURE_NOT_ENTITLED`
   for reads AND writes on gated modules. Applied to every quotes, invoices,
   reports, and reports/manage route; `advanced_analytics` gates the Phase-6
   analytics blocks inside `/api/reports` (data omitted for non-entitled
   plans). The Microsoft Graph routes were already gated via
   `with-graph-auth` (`outlook_email` / `calendar_sync` / `teams`).
7. `subscriptionWriteGate` already blocked writes on expired/suspended plans;
   `reports/manage` routes gained it plus the reports feature gate.

**UI locked states (`FeatureGate` — plan-aware):**
8. Quotes, Invoices, Reports and Report Management pages show "Available on
   Starter" locked states for Trial; the reports page additionally gates
   advanced-analytics sections behind "Available on Professional".
9. Quote/Invoice entry points removed from Trial: opportunity workspace header
   + primary actions, opportunity full-page quick actions, related sections,
   and company/customer workspace related lists (`useCanUse`).

**Platform Owner tooling (admin-only):**
10. `PlatformOwnerSection` on Administration (AOT accounts): Organizations
    list, PlanOverrideDialog (manual plan grants, no payment), SalesInquiries
    triage (convert to Trial workspace / grant plan / resolve), and
    SubscriptionChange audit trail. `isPlatformOwner` = SUPER_ADMIN role or
    `PLATFORM_OWNER_EMAILS` env allowlist.
11. Public sales funnel — `POST /api/sales-inquiries` (rate-limited,
    allowlisted in the RBAC audit) feeds the inquiry queue from the marketing
    site's Contact/Book-a-demo forms.
12. `GET /api/billing/subscription` feeds `useSubscription`/`TrialBanner`
    (trial countdown, read-only warnings, plan chip) and `FeatureGate`.

Verification (all green):
- `npx tsc --noEmit` — passes
- `npm test` (vitest) — **71/71 pass** (new `tests/unit/entitlements.test.ts`, 11 tests)
- `npm run lint` — passes
- `npx prisma migrate status` — 20 migrations, up to date
- Production build — see RELEASE_NOTES (bundle budget gate)

---

## 24-Section SaaS Master Plan — Audit (verification run, Aug 7)

Audited the live repo (code + migrations + tests + git state — not this file)
against the 24-section master plan. All 24 sections are implemented; the only
**gap found was fixed in this run**:

- **FIXED — legacy `/pipeline` route was missing** (Section 14). Every other
  merged legacy route had a `ViewRedirect`; `/pipeline` had none and 404'd.
  Added `app/(app)/pipeline/page.tsx` → `ViewRedirect(pathname="/opportunities",
  view="kanban")` with query-param preservation. No stale `navigation.ts`
  references to clean up.

Verified state per section (DONE unless noted):

| # | Section | Status | Evidence |
|---|---------|--------|----------|
| 1 | Stabilize CRM regressions | DONE | CompanyTable/InvoiceTable `cancelled`-flag fix, RecordModal/Base UI menu fixes, Profile/Sign Out, mail/send boundary normalization, Zoom NOT CONFIGURED (`integrations.useZoom`), Administration opens correctly |
| 2 | Microsoft multi-tenant auth | DONE | `lib/server/ms-auth.ts` — authority `organizations` unless `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` is explicitly set; issuer/token URL derived; `tid` persisted in JWT |
| 3 | Env var audit | DONE | Tenant-ID var is an **optional pin** (single-tenant override); default is multi-tenant `organizations`. No forced original-tenant login. `.env*` git-ignored. Report below |
| 4 | Org/tenant SaaS model | DONE | Organization/Member/Subscription/Plan/Entitlement/OnboardingState; `organizationId` scoping on all routes; `orgWhere()` never trusts client input |
| 5 | First login + auto Trial | DONE | `resolveOrganizationForSession` — tenant-keyed org, auto 14-day TRIAL (`TRIAL_DURATION_DAYS` configurable), statuses TRIALING/ACTIVE/EXPIRED/SUSPENDED/CANCELED, expired never deletes (read-only + upgrade banner) |
| 6 | Platform Owner in-app | DONE | `PlatformOwnerSection` (orgs, trials, subs, plans, feature access, demo requests, integration/usage/health), `isPlatformOwner` allowlist |
| 7 | Owner manual access | DONE | `grantPlan()` — Trial/Starter/Pro/Enterprise, extend/expire/suspend/reactivate/revoke, sources TRIAL/MANUAL/SALES/DEMO/PARTNER/BILLING/INTERNAL, full `SubscriptionChange` audit (actor/prev/new/reason/timestamp) |
| 8 | Feature entitlements | DONE | One system `lib/entitlements.ts` + `featureGate()` server-side + `FeatureGate`/`useCanUse` UI; fail-closed unknown plans; 11 unit tests |
| 9 | Paid plan matrix | DONE | TRIAL/STARTER/PROFESSIONAL/ENTERPRISE layered inheritance exactly per spec; no unbuilt features advertised (pricing page verified) |
| 10 | Pricing | DONE | Public page: Starter (Contact Sales) / Professional (Most Popular, Contact Sales) / Enterprise (Custom, Talk to Sales). No public Trial card |
| 11 | Get Started | DONE | Hero + Header → `/login` → Entra sign-in → org + auto Trial → onboarding → CRM |
| 12 | Request Demo / Contact Sales | DONE | `POST /api/sales-inquiries` (rate-limited, public) → SalesInquiry; owner triage (pending/lead/trial/plan-grant/resolve/reject); no auto Opportunity; "request received" confirmation |
| 13 | Lead conversion | DONE | NEW→CONTACTED→QUALIFIED→CONVERTED (+DISQUALIFIED); contact+company match/create, optional opportunity; duplicate-conversion guard; history kept |
| 14 | Opportunities kanban-first | DONE | `/opportunities` opens Kanban; view order Kanban/List/Forecast; `/kanban` redirect; **`/pipeline` redirect added this run**; drag/drop, Won/Lost, probability, health, workspace, quotes/invoices preserved |
| 15 | Dashboard simplification | DONE | 6 KPIs (Pipeline Value, Forecast Revenue, Won Revenue, Open Opportunities, Win Rate, Overdue Activities); sections Pipeline by Stage, Revenue/Forecast, Upcoming Activities, Recent Opportunities; secondary analytics moved to Reports |
| 16 | Modal close audit | DONE | RecordModal: X + aria-label="Close" + Escape + focus trap/restore; unsaved Close→Stay/Discard; Delete = X/Cancel/Delete (ConfirmDialog); no trap |
| 17 | Profile + Sign Out | DONE | Avatar menu (name/email/View Profile/Sign Out); `/profile` CRM-first with async Graph enrichment (never crashes); signOut→/login |
| 18 | Microsoft Graph | DONE | Scopes (User.Read, Calendars.ReadWrite, Mail.ReadWrite/Send, OnlineMeetings.ReadWrite, Presence.Read, offline_access, openid, profile, email); encrypted token store; per-user lookup; real statuses (CONNECTED/SIGN_IN_REQUIRED/RECONSENT_REQUIRED/TOKEN_EXPIRED/CONFIGURATION_ERROR/GRAPH_UNAVAILABLE) |
| 19 | Email/Calendar/Teams/Zoom | DONE | Email send fixed (normalize at boundary + Graph wire schema); calendar local-first bidirectional sync (graphEventId/changeKey/dedupe/retries); Teams only when entitled+connected; Zoom "Zoom is not configured." graceful |
| 20 | Dev onboarding reset | DONE | `POST /api/dev/onboarding-reset` (dev-only) resets onboarding/tour/getting-started; never touches CRM data |
| 21 | Security | DONE | RBAC audit test (guards all API routes), tenant isolation + subscription access, no cross-tenant IDOR (orgWhere server-side), Graph token AES-256-GCM, input validation, doc isolation, no exposed secrets |
| 22 | Local validation | DONE | tsc ✅ lint ✅ 71/71 tests ✅ build ✅ bundle budget ✅ security audit ✅ `prisma migrate status` up to date ✅ |
| 23 | Documentation reconciliation | DONE | PROGRESS.md updated to real state; RELEASE_NOTES.md rewritten from verified implementation |
| 24 | Azure — report only | NOT STARTED (report-only) | No Azure changes; production env checklist in DEPLOYMENT.md + final report below |

**Master plan completion: 23/24 sections complete** (Section 24 is report-only,
no code required — production env checklist below).

**Remaining work (post-audit):** live localhost E2E of the auth+tenant flows
(Section 22 items 1–28) using real Entra credentials; Azure deployment env
configuration per DEPLOYMENT.md.

---

## ✅ Pre-Production Cleanup & Azure Readiness — COMPLETE (Aug 7)

Targeted cleanup + Azure readiness verification run (resume brief). No SaaS
functionality was rebuilt or reimplemented; these are root-cause fixes and
verification only.

### 1. Pricing "Most Popular" badge — FIXED
- **Root cause:** `components/ui/card.tsx` Card carries `overflow-hidden` (for
  rounded images). The badge was an absolutely-positioned child of the Card at
  `-top-3`, so the card clipped it to a sliver above the border.
- **Fix:** hoisted the badge OUT of the Card onto the card's `relative`
  grid-item wrapper, where no ancestor clips overflow. Applied to BOTH
  `app/pricing/page.tsx` ("Most popular") and
  `components/marketing/PricingSection.tsx` ("Recommended", home page).
- **Browser verified** (headless Chrome 1440×1000, CDP rect math): badge fully
  inside viewport, horizontally centered on the Professional card (±0.5px),
  zero clipping ancestors, Starter/Professional/Enterprise aligned, no
  viewport/overflow clipping.

### 2. MicrosoftEcosystem duplicate key — FIXED
- **Root cause:** the `integrations` dataset contained TWO records with
  `id: "powerbi"` — a genuine duplicate data record, not a legitimate
  multi-render. All three mapped collections (chips, diagram buttons, SVG
  lines) keyed by `integration.id`, so React warned on every collection.
- **Fix:** the duplicate record is now a distinct integration
  (`dynamics` / "Dynamics 365", `Building2` icon, own detail copy). Power BI
  preserved; no index keys; warning not suppressed.
- **Browser verified:** home + pricing + integrations — ZERO React
  duplicate-key warnings in the console.

### 3. Opportunity workspace duplicate close (X) — FIXED
- **Root cause:** `RecordWorkspace` renders shadcn `DialogContent`, which
  renders its own absolute top-right X by default. `OpportunityWorkspace` also
  passes a fully custom header (`OpportunityWorkspaceHeader`) that renders its
  own X → two close controls on one dialog.
- **Fix (root cause, generic):** `RecordWorkspace` gained `showCloseButton`
  whose default is `false` when a custom `header` is supplied (the header owns
  the close) and `true` otherwise — a future custom-header workspace can't
  regress to two X's. OpportunityWorkspaceHeader keeps the single X
  (top-right, `aria-label="Close"`, mouse + keyboard, Escape + focus restore
  via the base-ui Dialog root). Other module workspaces (default header) keep
  their single DialogContent X — no regressions.
- **Nested dialogs audited:** CreateQuoteModal / CreateInvoiceModal /
  AddActivityDialog / AssignOpportunityDialog / UploadDocumentDialog /
  EditOpportunityDialog each render exactly one `DialogPrimitive.Close`;
  DealQuickUpdateDialog + ConfirmDialog + OpportunityModal (RecordModal) each
  render exactly one X.
- **Regression guards added** in `tests/unit/modal-refactor.test.ts` (75
  tests total, was 71).

### 4. Product Tour — code-verified; live run needs Entra credentials
- Exactly one X (top-right, inside the tooltip card) + Skip/Back/Next/Finish.
- Escape now dismisses in BOTH welcome and tour modes (was tour-only).
- Tooltip bottom is clamped to the viewport using the tooltip's measured
  height (ResizeObserver) instead of a fixed 240px allowance, plus
  `max-height: calc(100dvh - 24px)` + scroll fallback on short screens.
- Tour is portal-rendered (z-80), not nested in a Dialog — no inherited
  duplicate close.

### 5. Azure environment — VERIFIED (config-level)
- **Multi-tenant authority:** `lib/server/ms-auth.ts` returns `organizations`
  unless BOTH `AUTH_MICROSOFT_ENTRA_ID_SINGLE_TENANT=true` AND
  `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` are set. A tenant GUID in the
  TENANT_ID var alone does NOT pin the tenant. `.env.local` does not define
  TENANT_ID (multi-tenant default). No original-tenant GUID is forced.
- **AUTH_URL:** drives Auth.js redirects + Graph webhook base URL
  (precedence AUTH_URL > NEXTAUTH_URL > WEBSITE_HOSTNAME; the localhost
  fallback is dev-only and unreachable when AUTH_URL is set).
- **Exact Entra redirect URI required:**
  `{AUTH_URL}/api/auth/callback/microsoft-entra-id` (Auth.js v5 provider
  `microsoft-entra-id`; callback route `app/api/auth/[...nextauth]/route.ts`).
  For Azure: `https://<app-service>.azurewebsites.net/api/auth/callback/microsoft-entra-id`.
- **Env vars used by current code** (Azure supplies where applicable):
  AUTH_MICROSOFT_ENTRA_ID_ID, AUTH_MICROSOFT_ENTRA_ID_SECRET, AUTH_SECRET,
  AUTH_URL, DATABASE_URL, DIRECT_URL (Prisma CLI), SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY (server-only), SUPABASE_STORAGE_BUCKET,
  USE_MICROSOFT_GRAPH, MICROSOFT_GRAPH_MODE, PLATFORM_OWNER_EMAILS,
  TRIAL_DURATION_DAYS (default 14), CRON_SECRET (optional; guards the sync
  worker). Non-secret client flags (defaulted): NEXT_PUBLIC_DATA_SOURCE,
  NEXT_PUBLIC_STORAGE_PROVIDER, NEXT_PUBLIC_USE_MICROSOFT_GRAPH,
  NEXT_PUBLIC_USE_ZOOM.
- **Production start:** `npm run build` (prisma generate + next build +
  bundle-budget gate) then `npm start` (`next start`, `output: standalone`).
  `next dev` is never used in production.
- **Prisma:** `npx prisma migrate status` → "Database schema is up to date!"
  (20 migrations, Supabase pooler). Runtime uses DATABASE_URL via the pg
  adapter; the CLI uses DIRECT_URL ?? DATABASE_URL. Apply migrations with
  `prisma migrate deploy` at deploy time — never `migrate reset`.

### 6. Request Demo — VERIFIED
- Public `POST /api/sales-inquiries` persists SalesInquiry (rate-limited,
  allowlisted in the RBAC audit) → confirmation screen → Platform Owner
  triage (Administration → Demo Requests: pending/lead/trial/plan-grant/
  resolve/reject). No payment; no auto Opportunity.
- **Email notifications: NOT IMPLEMENTED** — no mailer exists in the codebase.

### 7. Platform Owner — VERIFIED (config-level)
- `isPlatformOwner` = SUPER_ADMIN role OR `PLATFORM_OWNER_EMAILS` allowlist.
  Normal customers cannot reach owner-only administration (server-side).

### 8. Validation (all green)
- `npx tsc --noEmit` ✓ · `npm run lint` ✓ (scripts/*.cjs now ignored —
  deliberately CommonJS helpers) · `npm test` ✓ **75/75** · `npm run build` ✓
  (108 chunks within budget) · `npx prisma migrate status` ✓ up to date ·
  `npm run audit:security` ✓ no blocking findings.

### Remaining manual tests (need real Microsoft Entra credentials)
- Microsoft login → dashboard → Kanban → open opportunity (verify single X),
  nested dialogs (quote/invoice/quick-update), Product Tour run-through,
  Profile, Administration, Demo Requests triage, and the live Azure App
  Service itself (AUTH_URL, redirect URI, migrations, `npm start`).

---

## ✅ Tenant-Based Platform Owner Authorization + App UX Fixes — COMPLETE (Aug 7)

Targeted authorization + UI/UX run. **Nothing was committed or pushed.**

### 1. Platform Owner detection — now tenant-based (was email/role-based)
- **Root cause of "Access restricted":** `isPlatformOwner` decided ownership
  by role (SUPER_ADMIN) or the `PLATFORM_OWNER_EMAILS` allowlist. An AOT-tenant
  account with a normal role was not an owner, so Administration showed
  "Access restricted".
- **New PRIMARY rule (exactly as requested):** the authenticated session's
  verified Microsoft Entra `tid` === `AOT_PLATFORM_TENANT_ID` ⇒ Platform Owner.
  The tid is extracted from the id_token in the Auth.js jwt callback
  (`extractTenantId(account.id_token)` fallback `profile.tid`) and carried on
  `session.user.tenantId` — never taken from the browser, email domain,
  localStorage, URL, or any client-supplied id. A customer tenant's Entra
  admin has a different tid ⇒ never a Platform Owner.
- **Centralized server-side helpers:** `lib/server/platform-tenant.ts`
  (`isAotPlatformTenantConfigured`, `isAotPlatformTenantId`) + `isPlatformOwner`
  in `lib/server/tenant.ts` (tenant-rule first) + `requirePlatformOwner()` in
  `lib/server/api.ts` (returns user+tenantId or null → callers return 403).
- **All 5 `/api/platform/*` routes** now use `requirePlatformOwner()` and
  return 403 for non-owners (organizations, organizations/[id]/plan,
  sales-inquiries, sales-inquiries/[id], subscription-changes).
- **`/administration`** — Platform Owners bypass the role gate and see the
  full owner interface (Organizations, Trials, Subscriptions, Plans/Feature
  Access, Demo Requests, Integration Status, Usage, System Health). External
  tenant users still see "Access restricted" and owner APIs still 403.
- **Avatar indicator:** `session.user.isPlatformOwner` (display-only; computed
  server-side in the session callback) drives a small "👑 Platform Owner"
  badge in the profile dropdown. Enforcement stays in requirePlatformOwner().
- **`PLATFORM_OWNER_EMAILS`:** audited — it now only acts as a DEPRECATED
  transitional fallback when `AOT_PLATFORM_TENANT_ID` is NOT configured. The
  two systems never compete (email path is ignored once the tenant id is
  configured). `AOT_PLATFORM_TENANT_ID` documented in `.env.local` (commented)
  + `DEPLOYMENT.md`. Auth remains multi-tenant `organizations` —
  `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` is NOT reused for authorization and stays
  unset/empty.
- **Tests:** new `tests/unit/platform-owner.test.ts` (tenant-rule primary,
  never-owner-when-unconfigured, case/whitespace tolerant) + `rbac-audit`
  contract updated to recognize `requirePlatformOwner` as a guard.

### 2. Command palette Escape — FIXED
- **Root cause:** the palette is a controlled, dynamically mounted base-ui
  Dialog; Escape relied on the host dialog's native dismissal, which was
  unreliable in this composition.
- **Fix:** single capture-phase `keydown` listener while open — the one and
  only Escape close path — with `preventDefault` + `stopPropagation` so it
  does not also dismiss the tour/menus/dialogs underneath. Ctrl/Cmd+K opens
  (unchanged), outside click closes (unchanged), focus returns to the input's
  opener via the existing focus restoration in the Dialog root.

### 3. Profile menu — Help & Support now real
- **Help & Support** opens a new `SupportModal` (subject, category, message,
  current user name/email, current route, timestamp). It REUSES the existing
  Tickets model via a purpose-built `POST /api/support` route — no second
  support architecture. Category → `Ticket.department`, requester →
  `Ticket.requester`, subject prefixed `[Support]`, page reported in the
  description. On success: "Your support request has been submitted." (no
  email is sent — nothing claims otherwise).
- **Security:** the support route authenticates via `getCrmUser()` and derives
  `organizationId` server-side from the session (`organization:
  { connect: { id: user.organizationId } }`) — never trusts the browser.
  Tenant isolation preserved; tickets are only visible within the same
  organization's scope. Platform Owner access remains separately guarded.
- **Deliberate difference from the general tickets POST:** support skips the
  `subscriptionWriteGate` — a customer whose trial has expired or whose
  workspace is suspended can still ask for help (a support request is a
  help-channel write, not a plan-gated feature write). All other tickets
  writes keep the gate.
- **"About AOT CRM"** removed from the profile dropdown (not replaced with a
  dead item).

### 4. App logo matches favicon
- The sidebar logo (generic black "A" square) was replaced with the actual
  brand artwork `public/Logo.png` — the same asset the favicon/app-icon uses.
  No duplicate brand asset; aspect ratio preserved; light/dark safe;
  `alt="AOT CRM logo"`. (Desktop + mobile sidebar both updated.)

### 5. Profile menu accessibility — verified
- Avatar click opens; outside click closes; Escape closes (menu-level);
  arrow-key navigation; proper GroupLabel-in-Group structure (no Base UI
  MenuGroupContext warning); View Profile routes to `/profile`; Sign Out
  still works (`signOut({ callbackUrl: "/login" })`). Single menu instance.

### 6. Previously-fixed items re-verified in-browser (headless Chrome via CDP)
- **Pricing badge** (`/pricing`): fully visible in viewport after scroll,
  centered on the Professional card (badge center 371.5px vs card center
  371.5px — ±0.5px), zero overflow-hidden clipping ancestors.
- **MicrosoftEcosystem** (home / pricing / integrations): ZERO React
  duplicate-key warnings.

### 7. Validation (all green)
- `npx tsc --noEmit` ✓ · `npm run lint` ✓ · `npm test` ✓ **83/83** (added
  platform-owner suite) · `npm run build` ✓ (bundle-budget gate passes) ·
  no schema changes (20 migrations).

### Remaining manual tests (need real Microsoft Entra credentials)
- Sign in with an AOT/Ascend One tenant account → Administration → owner
  interface + Platform Owner badge. Sign in with an external tenant account
  (and an external tenant admin) → Platform Owner NO, owner API 403, owner
  UI absent. Multi-tenant login + auto org/trial. Command palette Ctrl+K /
  Escape. Help & Support submit → ticket persists → visible in Tickets. App
  logo vs favicon. Opportunity single X + Product Tour (already code-verified
  in the prior run). Then the live Azure App Service deployment.

---

## ✅ Post-Phase-11 Platform/People/Integrations Audit — COMPLETE (Aug 7)

Root-cause audit + fixes per the 16-point brief. **Nothing committed/pushed.**

### 1. Platform Owner — VERIFIED (no code change needed)
- `AOT_PLATFORM_TENANT_ID` confirmed set in `.env.local` (key presence only;
  value never printed) + Azure App Service. `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`
  and `AUTH_MICROSOFT_ENTRA_ID_SINGLE_TENANT` are unset — multi-tenant
  `organizations` login intact.
- Chain verified: id_token `tid` (`extractTenantId`/`profile.tid`) →
  `session.user.tenantId` → `isAotPlatformTenantId` vs `AOT_PLATFORM_TENANT_ID`
  → `requirePlatformOwner()` (403 for non-owners) + `administration/page.tsx`
  + navbar badge. `PLATFORM_OWNER_EMAILS` is fallback-only.
- JWT sessions minted before the env var existed need sign-out/sign-back-in.

### 2. Customers/Contacts/People architecture — CONSOLIDATED (UI/nav only)
- **Data model:** `Customer` IS a separate DB entity (rich: opportunities,
  quotes, invoices, tickets, leads, calendarEvents; carries `contactId`
  migration-path link to `Contact`). `Contact` is the lightweight person
  (linked to Company, buyer `role`). `Lead` is the pre-conversion prospect.
- **Why "Customers" appeared in the sidebar:** `/customers/<uuid>` full-page
  made `AppSidebar` surface the hidden Customers item (`!hidden || href ===
  activeHref`). No data-model change was needed.
- **Fixes (no schema/migration, no data loss):** AppSidebar never surfaces
  hidden items; `findActiveItemHref` normalizes legacy prefixes
  (`/customers*`, `/leads*` → `/contacts`, `/files*` → `/documents`,
  `/inbox*` → `/activities`) via new `canonicalModulePath`.
- **Breadcrumbs:** `customers` segment now renders as **People**; record
  detail paths resolve the **human-readable name** from the existing
  org-scoped record API (Home > People > Jane Doe — never a raw UUID),
  with a neutral ellipsis while loading and a module-level cache.
- `RecordWorkspace` modal clipping FIXED: definite viewport-capped heights
  (`sm:h-[min(86dvh,900px)]` split / `sm:h-[min(90dvh,900px)]` default),
  `max-h-dvh` mobile override, removed the broken `sm:grid-cols-[1fr_auto]`,
  explicit `auto / minmax(0,1fr) / auto` grid rows, header `pr-14` so actions
  clear the single shell X, split inspector column scrolls independently.

### 3. Lead conversion — HARDENED (no duplicates)
- Contact and Customer are now **matched by email (org-scoped, unarchived)
  and reused** before creating — converting the same person twice no longer
  duplicates records. Company match-by-name, duplicate-conversion 409,
  Qualified-only gate, retained original lead, optional Opportunity, and
  audit/activity all preserved.
- Navigation from a converted lead: `convertedCustomerId` + `convertedContactId`
  added to `leadToUI` (new `leadUIInclude`); LeadWorkspace and the lead detail
  page now link to the contact, customer (via `/contacts?view=customers&record=`),
  and opportunity. Post-conversion fallback routes to `/contacts?view=customers`.

### 4. Microsoft 365 — provider-accurate states
- **Outlook Calendar:** push direction preserved untouched (verified working);
  reverse (Outlook→CRM) is IMPLEMENTED (`pullCalendarDelta` delta cursors,
  changeKey dedupe, 410 recovery) and wired to manual sync, the background
  worker, and the webhook — but NOT live-verified end-to-end (needs a real
  Outlook event + reachable webhook URL).
- **Teams:** uses the separate **Online Meetings API** (`/me/onlineMeetings`)
  with delegated `OnlineMeetings.ReadWrite` (already in the auth scope list)
  — NOT calendar-event `isOnlineMeeting`. Real blockers surfaced accurately
  now: plan entitlement (403 FEATURE_NOT_ENTITLED → NOT CONFIGURED state) and
  the account needing a **Microsoft Teams license** in Entra. New
  `classifyTeamsError()` reports **"Microsoft Teams unavailable" / "Unable to
  load/create Teams meetings."** — never "Microsoft 365 unavailable" when
  Outlook/Calendar is connected. No Entra changes were made.
- **Zoom:** NOT IMPLEMENTED (stub service + always-503 route; no OAuth/env
  vars/webhooks). Graceful **"Zoom is not configured."** preserved; Meetings
  view shows a NOT CONFIGURED chip and skips the API entirely.
- MeetingsView rebuilt with Teams and Zoom as **independent providers**
  (per-section status chips + banners); `NOT_CONFIGURED` added to the
  `IntegrationState` union (banner + admin status page updated).

### 5. Regressions preserved
- Command palette Ctrl/Cmd+K open + capture-phase Escape close (single path);
  Product Tour Escape; dialogs/drawers/profile menu; single close X per
  dialog (modal-refactor suite extended with viewport invariants).
- Profile menu: View Profile / Platform Owner badge / Appearance / Command
  Palette / Help & Support (existing Ticket flow via `POST /api/support`) /
  Restart Product Tour / Sign Out. "About AOT CRM" stays removed.

### 6. Validation (all green)
- `npx tsc --noEmit` ✓ · `npm run lint` ✓ · `npm test` ✓ **116/116** (new
  suites: meetings-providers, lead-conversion, breadcrumbs; extended
  navigation-active + modal-refactor) · `npm run build` ✓ (bundle budget OK,
  103 chunks) · no schema changes (20 migrations).

### Remaining manual tests (need real Entra credentials)
See the brief's checklist: sign out/in with the AOT account → Platform Owner
badge + /administration; People modal bottom reachable; full-page breadcrumb;
Customers sidebar duplication gone; converted-lead navigation; CRM→Outlook
create still lands; Teams shows provider-specific state (entitlement/license);
Zoom NOT CONFIGURED; Ctrl+K → Escape.

---

## Notes for the resuming session

- **Do not re-verify Phases 1–11** beyond the checkpoint gates above; continue
  from the post-Phase-11 + post-audit state.
- If any of the verification gates fail on resume, treat that as a genuine
  blocker (per session policy) before continuing.
