---
name: m365-zoom-integration
description: Standardize Microsoft Entra, Graph, Outlook, Calendar, Teams, and Zoom implementation: dedicated services, signed-in user identity, real logout, email workflows, calendar sync, Teams meetings, Zoom OAuth, mock/live provider distinction, permission docs.
license: MIT
compatibility: opencode
metadata:
  domain: crm
  audience: all
  workflow: integration
---

## What I do

I standardize Microsoft Entra, Microsoft Graph, Outlook, Calendar, Teams, and Zoom implementation.

## Architecture rules

- All Graph and Zoom calls go through dedicated services in `services/`
- No provider calls directly from components — use service abstractions
- Use signed-in user identity from auth — never `user@company.com` placeholders
- Profile: photo, name, email, role, department, job title, manager
- Real logout behavior via auth provider
- Outlook email send/reply/forward/draft through dedicated service
- Outlook Calendar event creation and synchronization through the event sync architecture
- Teams online meeting creation generates join URLs
- Zoom OAuth flow with meeting creation
- Clear distinction between mock (`services/*.mock.ts`) and live (`services/graph.service.ts`) providers
- No "Email sent" or "Meeting created" notification before provider confirms
- User-friendly error messages for integration failures
- Document required Graph permissions and scopes

## When to use me

Trigger this for:
- email
- meetings
- calendar
- user profile
- Teams
- Outlook
- Graph
- Zoom
- presence
- integration settings

## Prohibited

- Direct provider API calls from components
- Using placeholder user identities
- Showing success before provider confirmation
- Hardcoded credentials or tokens

## Validation

- Verify all provider calls route through service layer
- Confirm signed-in identity is used for all operations
- Check mock providers match live provider interface exactly
- Ensure error states show user-friendly messages
- Verify permission documentation is included
