---
name: enterprise-design-system
description: Keep all AOT CRM screens visually consistent and enterprise-ready: original AOT branding, compact spacing, semantic tokens, responsive layouts, accessibility, keyboard nav, reduced motion, Fluent-style motion, consistent components.
license: MIT
compatibility: opencode
metadata:
  domain: crm
  audience: all
  workflow: ui
---

## What I do

I keep all AOT CRM screens visually consistent and enterprise-ready.

## Architecture rules

- Use original AOT branding — never copy monday CRM, noCRM, HubSpot, Zoho, Salesforce, or Dynamics
- Compact enterprise spacing applies everywhere
- Sidebar and content alignment must be consistent
- Support light, dark, and system themes via semantic design tokens
- Responsive layouts for all breakpoints
- Accessibility: keyboard navigation, focus indicators, aria labels, semantic HTML
- Reduced-motion support via `prefers-reduced-motion`
- Fluent-style motion and transitions (subtle, purposeful)
- Consistent cards, tables, forms, dialogs, drawers, menus, and charts
- Use shared page and module layouts from `components/layout/`

## When to use me

Trigger this for:
- UI changes
- layout changes
- dashboard work
- marketing pages
- onboarding screens
- dark-mode fixes
- responsive fixes
- animation work

## Prohibited

- Copying competitor UI patterns
- Inconsistent spacing or typography
- Creating new layout files if shared ones exist
- Hardcoding theme values instead of using design tokens

## Validation

- Check light and dark theme rendering
- Verify responsive behavior at mobile, tablet, desktop
- Confirm keyboard navigation works
- Confirm `prefers-reduced-motion` is respected
- Verify component uses shared design tokens
