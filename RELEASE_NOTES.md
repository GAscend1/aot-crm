# AOT CRM — Release Notes

> Release candidate — all ten roadmap phases implemented.

## v0.2.0 — SaaS Multi-tenancy & Subscriptions

### Phase 11 · SaaS Multi-tenancy & Subscriptions
- **Multi-tenant by design** — every CRM table is scoped to an `Organization`
  keyed by the authenticated Microsoft Entra tenant id (`tid`, never the email
  domain). New signups get an isolated workspace + automatic 14-day Trial;
  legacy data lives in the backfilled default workspace.
- **Plans & entitlements** — TRIAL / STARTER / PROFESSIONAL / ENTERPRISE with
  layered feature inheritance (`lib/entitlements.ts`, unit-tested). Trial is a
  useful evaluation (Companies, Contacts, Leads, Opportunities + Kanban, Tasks,
  Activities) — never read-only — but excludes Quotes, Invoices, Reports,
  Advanced Analytics, Automation, API, and Microsoft 365 integrations.
- **Server-side enforcement** — `featureGate()` returns 403
  `FEATURE_NOT_ENTITLED` on every quotes/invoices/reports/manage route (reads
  and writes); `/api/reports` omits `advanced_analytics` blocks for plans
  without the entitlement; Graph routes were already gated by
  `with-graph-auth`. The UI can never widen access.
- **UI locked states** — plan-aware `FeatureGate`: Trial sees "Available on
  Starter" cards on Quotes/Invoices/Reports; advanced analytics sections show
  "Available on Professional". Quote/Invoice entry points (workspace headers,
  quick actions, related lists) are hidden for non-entitled plans.
- **Platform Owner console** — on Administration for AOT accounts:
  Organizations list, manual plan override (Trial/Starter/Professional/
  Enterprise, no payment), sales-inquiry triage (convert to Trial workspace /
  grant plan / resolve), and a full `SubscriptionChange` audit trail.
- **Trial lifecycle** — `TrialBanner` countdown chip, dismissible; expired /
  suspended workspaces become read-only with upgrade prompts (data never
  deleted).
- **Public sales funnel** — rate-limited `POST /api/sales-inquiries` from the
  marketing site feeds the Platform Owner's inquiry queue.

---

## v0.1.0 — First Release

### Phase 1 · Workspace Modernization & Stability
- Shared CRUD primitives (`RecordModal`, `ConfirmDialog`, `FormError`, `use-async-submit`)
  replaced 24 per-module drawer/delete components.
- Single-page module architecture with query-param views and preserved legacy routes.
- Activities "work engine" (Timeline / Calendar / Tasks / Meetings / Email), opportunity
  workspace with forecast, onboarding tour foundation, dashboard additions, archiving,
  error boundaries (`error.tsx` / `global-error.tsx`), and the Next 16 proxy middleware.

### Phase 2 · CRM Simplification & Navigation
- Navigation reduced 13 → 11 items: General / CRM / Sales / Work / Documents / Reports /
  Administration. Leads, Customers, Inbox, and Files merged into smarter views.
- Mobile quick-nav tab bar, view-aware breadcrumbs, command palette + onboarding sync.

### Phase 3 · Unified Sales Workspace
- Win/loss tracking (`wonReason`, `lostReason`, `closedAt`) with a stage-move safety net.
- Deal-health indicators and stage-aware quick actions on kanban cards.
- Microsoft Graph runtime integration states replaced the fake "pending approval" UX;
  real consent/expiry/error classification across calendar, meetings, and email.

### Phase 4 · Contact/Company 360
- Aggregation endpoints with real counts; company + contact 360 workspaces with tabs,
  relationship graph, health scores, upcoming meetings/tasks, and merged timelines.
- Generic document upload linked to any entity, contact buyer-persona roles.

### Phase 5 · Unified Activity Center
- Local-first Microsoft Graph calendar sync: push/pull delta sync, retry queue with
  exponential backoff, webhook receiver with `clientState` gate, encrypted per-user
  refresh tokens (AES-256-GCM keyed off `AUTH_SECRET`).

### Phase 6 · Analytics-First Dashboard
- KPIs, pipeline velocity, conversion funnel, 6-month revenue forecast, win/loss reason
  breakdown, team productivity, and customer-health snapshot. Drill-downs + CSV export
  from every report section.

### Phase 7 · Performance Optimization
- TanStack Query caching (shared dashboard query, deduped api-list), SSR prefetch +
  hydration, route-level code splitting, and a build-gated 512 KB bundle budget.

### Phase 8 · UX/UI Polish
- Full design-token pass: hardcoded `slate-*`/`bg-white` classes migrated to semantic
  tokens across the dashboard, overlays, tables, dialogs, and leads module.
- `MotionConfig reducedMotion="user"`, missing focus-visible states, token-based skeletons.

### Phase 9 · First-Time User Onboarding
- New `/onboarding` wizard: role selection (self-service whitelist), optional sample-data
  seeding (idempotent, empty-workspace only), notification opt-in, guided tour hand-off.
- Welcome modal gained a "Guided setup" entry; dashboard gained a contextual
  "Get Started" checklist that ticks off as the workspace fills.

### Phase 10 · Production QA & Release
- **RBAC audit** — static contract test asserting every `app/api/**/route.ts`
  authenticates the caller (and admin routes enforce `isAdmin`).
- **E2E API smoke suite** — live-server checks of auth guards + public routes
  (`npm run test:e2e`).
- **Security audit** — `npm run audit:security` scans for hardcoded secrets, XSS
  surfaces, client-side env leakage, and missing `rel` attributes.
- **Load test** — `npm run load:test` dependency-free latency/throughput probe.
- Deployment checklist + this release notes document.

---

## Verification

| Gate | Command | Status |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | ✅ |
| Unit tests | `npm test` (71 tests) | ✅ |
| Lint | `npm run lint` | ✅ |
| Production build + bundle budget | `npm run build` | ✅ |
| RBAC audit | `npm test` (rbac-audit suite) | ✅ |
| Security audit | `npm run audit:security` | ✅ |
| API smoke (live server) | `npm run test:e2e` | ✅ (needs running app) |
| Microsoft Graph integration | `npm run test:integration` | ✅ (needs running app + auth) |

---

## Known limitations (deferred)
- Microsoft Graph webhook delivery requires a public HTTPS URL and consented scopes.
- Sample-data seeding is gated to an empty workspace by design.
- Self-service role selection excludes admin/owner roles (assigned by an admin).
- Paid billing/checkout is not yet wired — plan grants are manual (Platform
  Owner) or seeded; a Stripe/billing provider integration is a follow-up.
- Trial enforcement is feature-scoped (Quotes/Invoices/Reports/Advanced
  Analytics/M365 integrations) — core CRM reads and writes remain fully
  available so prospects can genuinely evaluate the product.
