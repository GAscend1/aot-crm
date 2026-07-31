---
name: aot-crm-architecture
description: Protect and enforce the approved AOT CRM feature-based architecture: Next.js App Router, TypeScript strict, shared components, service/repository layers, DTOs, domain interfaces, no duplicated functionality, mock/local providers, configuration-driven Azure replacement.
license: MIT
compatibility: opencode
metadata:
  domain: crm
  audience: all
  workflow: architecture
---

## What I do

I enforce the approved AOT CRM feature-based architecture.

## Architecture rules

- Next.js App Router conventions only — no Pages Router patterns
- TypeScript strict mode; no `any`, `@ts-ignore`, `eslint-disable`
- Reuse shared components from `components/` before creating new ones
- Business logic belongs in `services/` or `repository/` — never in components
- DTOs and domain interfaces go in `types/` or co-located with their module
- No duplicated functionality — check existing code first
- Use mock/local providers until Azure access is available
- Azure provider replacement must be configuration-driven (env vars)
- Before creating new files, inspect existing code for patterns

## When to use me

Trigger this for:
- new CRM modules
- refactoring
- architecture changes
- service creation
- repository creation
- route changes
- shared component changes
- merge reconciliation

## Prohibited

- Inventing files, folders, or APIs that do not exist
- Skipping existing code inspection before writing new code
- Creating new components when a shared one already exists
- Mixing business logic with presentation

## Validation

- Verify route follows App Router pattern (`app/(app)/<route>/page.tsx`)
- Confirm shared component exists before creating anew
- Check services use proper DTOs and interfaces from `types/`
- Ensure no `any` types leak into the codebase
