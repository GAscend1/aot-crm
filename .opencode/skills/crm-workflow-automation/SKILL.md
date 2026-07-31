---
name: crm-workflow-automation
description: Build reliable CRM automations using a Trigger-Condition-Action model: lead assignment, stale-lead alerts, follow-ups, reminders, stage-change workflows, won/lost, post-meeting actions, failed-email alerts, activity sync, notifications, audit entries, idempotent and retry-safe.
license: MIT
compatibility: opencode
metadata:
  domain: crm
  audience: all
  workflow: automation
---

## What I do

I build reliable CRM automations using a Trigger → Condition → Action model.

## Architecture rules

- Every automation follows Trigger → Condition → Action
- Lead assignment, stale-lead alerts, follow-up tasks, meeting reminders all go through the automation service layer
- Stage-change workflows and won/lost workflows live in `services/automation/`
- Post-meeting actions and failed-email alerts must be idempotent
- Activity timeline synchronization prevents duplicate entries
- Notifications and audit entries log every automation execution
- Duplicate-event prevention via idempotency keys
- Retry and failure handling with exponential backoff

## When to use me

Trigger this for:
- workflow automation
- lead assignment
- reminders
- notifications
- activity timeline sync
- audit entries

## Prohibited

- Creating duplicate activities
- Displaying success before an action actually succeeds
- Putting workflow logic directly inside UI components
- Using `console.log` as the final implementation

## Validation

- Verify idempotency key is used for each automation action
- Confirm no duplicate entries in activity timeline
- Check that retry and failure handling is implemented
- Ensure audit entries are created for each automation run
- Verify UI waits for provider confirmation before showing success
