# AOT CRM — Azure Deployment & Verification

Deployment target: **Azure App Service (Linux, Node 22 LTS)** with **Azure Database
for PostgreSQL (flexible server)**. This checklist covers provisioning, environment
configuration, deployment, and post-deploy verification.

---

## 1. Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string (`postgresql://user:pass@host:5432/db?sslmode=require`) |
| `AUTH_SECRET` | ✅ | At least 32 random bytes. **Also the encryption key for at-rest Graph tokens — rotating it invalidates stored refresh tokens.** |
| `AUTH_URL` | ✅ | Public app URL (`https://app.example.com`) |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | ✅ | Entra app (client) ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | ✅ | Entra client secret |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | — | **Optional single-tenant override ONLY** (only honored together with `AUTH_MICROSOFT_ENTRA_ID_SINGLE_TENANT=true`). Keep **unset/empty** for normal multi-tenant `organizations` login — do NOT put the AOT tenant GUID here. |
| `AOT_PLATFORM_TENANT_ID` | for Platform Owner | **Authorization only.** The AOT/Ascend One Entra tenant GUID whose accounts are Platform Owners. Never used as the OAuth authority — multi-tenant login stays `organizations`. |
| `PLATFORM_OWNER_EMAILS` | — | **DEPRECATED (transitional).** Comma-separated owner emails; only consulted when `AOT_PLATFORM_TENANT_ID` is unset. Remove once tenant-based ownership is live. |
| `TRIAL_DURATION_DAYS` | — | Automatic trial length in days (default `7` — full-feature evaluation). |
| `USE_MICROSOFT_GRAPH` | — | `"true"` enables Graph-backed calendar/mail/meetings |
| `MICROSOFT_GRAPH_WEBHOOK_URL` | for webhooks | Public HTTPS URL (see Phase 5) |
| `MICROSOFT_GRAPH_WEBHOOK_CLIENT_STATE` | for webhooks | Override default `aot-crm-calendar` if desired |
| `CRON_SECRET` | for sync worker | Guards `/api/calendar/sync/background` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | for docs | Document storage (or `NEXT_PUBLIC_STORAGE_PROVIDER=local`) |

Never commit secrets. Store them in App Service **application settings** (slot-safe).

## 2. Provision & deploy

```bash
# Prisma migrations
npx prisma migrate deploy

# Build (runs prisma generate + next build + bundle budget gate)
npm run build

# Deploy the build output (App Service: zip deploy or CI/CD)
#   - ORY: keep generated/ in the deploy package
```

Recommended CI/CD order on Azure:
1. `npm ci`
2. `npx prisma migrate deploy` (run only from one pipeline to avoid races)
3. `npm run build`
4. Publish

## 3. Post-deploy verification checklist

Run **in order** against the live deployment:

```bash
# 0. Reachability + auth redirects
E2E_BASE_URL=https://<app>.azurewebsites.net npm run test:e2e

# 1. Security audit (static, no server needed)
npm run audit:security

# 2. Unit + RBAC gates
npm test

# 3. Production build gate (bundle budget)
npm run build

# 4. Microsoft Graph integration (needs a signed-in test user + live server)
npm run test:integration

# 5. Quick load sanity (unauth routes → 401; adjust URL/headers for authed cost)
npm run load:test -- --url https://<app>.azurewebsites.net/login --requests 100 --concurrency 10
```

### Manual smoke (browser)
- [ ] `/login` loads; signing in with Entra redirects into the app.
- [ ] First-time user sees the welcome modal → Guided setup → `/onboarding` wizard.
- [ ] Role selection persists (visible on `/profile`).
- [ ] "Load sample data" seeds companies/customers/opportunities on an empty workspace.
- [ ] Dashboard renders KPIs + "Get Started" checklist; no console errors.
- [ ] `/opportunities` list, kanban, and forecast render.
- [ ] Calendar sync status bar appears (if Graph enabled).
- [ ] Dark mode toggle preserves contrast across dashboard and dialogs.
- [ ] Keyboard tab shows visible focus rings; `Ctrl+K` opens the command palette.

### Database checks
- [ ] `npx prisma migrate status` → "Database schema is up to date!"
- [ ] A test user's onboarding flags update in `User` (started/completed timestamps).
- [ ] Sample-data rows are **not** duplicated on a second "Load sample data" attempt.

## 4. Rollback
- App Service deployment slots: keep the previous slot, swap back on regression.
- DB migrations are forward-only — restore from a point-in-time backup for schema rollback.
- Rotating `AUTH_SECRET` invalidates encrypted Graph refresh tokens (tokens are re-issued
  on next interactive sign-in), so treat rotation as a coordinated maintenance action.

## 5. Monitoring
- App Service: enable application logging + web server logging.
- Configure health probes against `/login` (200) — the app does not expose a `/api/health`
  endpoint by design (auth guards are the canary).
- Watch `DATABASE_URL` pool saturation under `npm run load:test`; raise PgBouncer/connection
  limits if p99 latency degrades.
