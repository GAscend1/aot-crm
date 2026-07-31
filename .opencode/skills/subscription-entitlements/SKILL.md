---
name: subscription-entitlements
description: Implement SaaS plans, trials, limits, and feature gating centrally: Trial/Starter/Professional/Enterprise tiers, tenant subscription status, user/automation/storage limits, integration entitlements, upgrade dialogs, central feature keys, mock billing provider.
license: MIT
compatibility: opencode
metadata:
  domain: crm
  audience: all
  workflow: billing
---

## What I do

Implement SaaS plans, trials, limits, and feature gating centrally.

## Architecture rules

- Plans: Trial, Starter, Professional, Enterprise
- Tenant subscription status tracked in `services/subscription/`
- User, automation, and storage limits per plan tier
- Integration entitlements gated by plan
- Upgrade dialogs shown when user hits a limit
- Premium functionality is disabled but visible (greyed out)
- Centralized feature keys in `config/features.ts` — no scattered plan checks
- Mock billing provider until a real billing provider is approved

## When to use me

Trigger this for:
- pricing
- registration
- trials
- billing
- plan restrictions
- feature flags
- upgrade messaging
- tenant limits

## Prohibited

- Scattered plan checks inside components
- Hardcoding plan limits in UI code
- Blocking premium features completely (must be visible but disabled)

## Validation

- Verify all feature gates route through central feature keys
- Confirm upgrade dialogs trigger at correct limits
- Check premium features are visible but disabled
- Ensure mock billing provider matches live provider interface
- Verify tenant limits are enforced for each plan tier
