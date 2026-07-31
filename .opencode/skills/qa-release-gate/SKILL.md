---
name: qa-release-gate
description: Prevent incomplete, broken, or unsafe code from being committed or merged. Requires lint, build, TypeScript, unresolved-import checks, route verification, browser runtime checks, hydration/console-error/dead-button checks, profile/logout verification, integration labeling, responsive/theme checks, git checks.
license: MIT
compatibility: opencode
metadata:
  domain: crm
  audience: all
  workflow: qa
---

## What I do

Prevent incomplete, broken, or unsafe code from being committed or merged.

## Required checks

- `npm run lint` — zero errors required
- `npm run build` — must succeed
- TypeScript verification — no errors
- Unresolved import checks — no broken imports
- Route verification — all routes compile
- Browser runtime checks — no console errors
- Hydration error checks — no SSR mismatch
- Dead button checks — no non-functional interactive elements
- Profile/logout verification — auth flows work
- Integration mock/live labeling — clear which providers are mock vs live
- Responsive checks — mobile, tablet, desktop
- Light/dark theme checks — both render correctly
- Git branch verification — correct branch targeted
- Git identity verification — correct author
- Clean working tree confirmation — no uncommitted changes
- No push to main unless explicitly approved

## When to use me

Trigger this for:
- commit validation
- PR review
- release preparation
- merge gate

## Prohibited

- `eslint-disable` as a shortcut to suppress real issues
- `@ts-ignore` or `@ts-expect-error` without explicit justification
- Describing unresolved warnings as successful integrations
- Committing empty or corrupted files
- Merging when the production build fails

## Validation

- All checks must pass before commit or merge
- Generate a status report showing each check result
- If any check fails, abort and report exact failure
