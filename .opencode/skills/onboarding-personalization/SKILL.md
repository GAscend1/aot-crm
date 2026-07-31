---
name: onboarding-personalization
description: Build the first-login onboarding and workspace personalization flow: account info, company profile, industry, role, goals, pipeline template, communication channels, theme selection, dashboard widgets, notification prefs, save/skip/back/restart, completion state.
license: MIT
compatibility: opencode
metadata:
  domain: crm
  audience: all
  workflow: onboarding
---

## What I do

Build the first-login onboarding and workspace personalization flow.

## Architecture rules

- Multi-step wizard: account info, company profile, industry, company size, role, sales goals
- Sales pipeline template selection based on industry
- Communication channel choices: Outlook, Teams, Zoom connection options
- Theme selection (light, dark, system)
- Dashboard widget selection from available widgets
- Notification preferences (email, in-app, digest)
- Save and Continue Later persists progress
- Skip button lets users bypass optional steps
- Back button navigates to previous step
- Restart Onboarding resets all progress
- Completion state triggers personalized workspace generation
- Onboarding state persisted in `services/onboarding/`

## When to use me

Trigger this for:
- registration
- first login
- onboarding
- personalization
- workspace setup
- dashboard preferences

## Prohibited

- Skipping progress persistence
- Losing state on page refresh
- Blocking the user from skipping optional steps
- Forcing theme or dashboard selection

## Validation

- Verify multi-step wizard navigation works (next/back/skip/save/restart)
- Confirm progress persists across page refreshes
- Check completion state triggers workspace generation
- Ensure all steps can be skipped if user chooses
- Verify theme and dashboard selections apply correctly
