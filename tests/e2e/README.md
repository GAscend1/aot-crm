# E2E API Smoke Suite

Verifies a **live** deployment answers on the wire: authentication guards on
every CRM module API, public marketing routes, and auth redirects.

## Run

```bash
# 1. Start the app (separate terminal)
npm run dev          # or npm run build && npm start

# 2. Run the smoke suite against it
npm run test:e2e
```

Point at a different deployment:

```bash
E2E_BASE_URL=https://staging.example.com npm run test:e2e
```

The suite **skips gracefully** when no server is reachable, so it is safe to
run in CI pipelines that do not keep the app running.
