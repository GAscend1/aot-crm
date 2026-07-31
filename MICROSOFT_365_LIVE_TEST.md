# Microsoft 365 Live Test Document

## Prerequisites

- `NEXT_PUBLIC_USE_MICROSOFT_GRAPH=true` in `.env.local`
- Valid Microsoft Entra ID app registration with delegated permissions:
  `openid profile email offline_access User.Read User.ReadBasic.All Mail.Send Mail.ReadWrite Calendars.ReadWrite Presence.Read`
- Signed in with Microsoft Entra ID
- Browser devtools console open
- Network tab open, filter by `/api/integrations/microsoft`

## Test Cases

### 1. Sign Out and Sign In Again

**Steps:**
1. Click Sign Out
2. Verify redirected to sign-in page
3. Sign in with Microsoft Entra ID
4. Verify redirected back to dashboard
5. Check browser console for errors

**Expected:** Clean sign-in flow, no token errors in console.

**Status:** NOT TESTED

### 2. Profile

**Steps:**
1. Navigate to /profile
2. Verify display name matches Microsoft Entra ID
3. Verify email matches
4. Verify manager name loads (if applicable)

**Expected:** Live data from `GET /api/integrations/microsoft/profile` (calls `/me` + `/me/manager`).

**Status:** NOT TESTED

### 3. Profile Photo

**Steps:**
1. On /profile page
2. Check avatar shows current Microsoft 365 profile photo
3. Open Network tab, verify `GET /api/integrations/microsoft/photo` returns 200

**Expected:** Photo loads from `GET /me/photo/$value` via dedicated route.

**Status:** NOT TESTED

### 4. Presence

**Steps:**
1. On /profile page
2. Verify presence dot reflects current availability
3. Change Teams status
4. Refresh profile — verify updated

**Expected:** Live presence from `GET /me/presence`.

**Status:** NOT TESTED

### 5. Send Email

**Steps:**
1. Open any entity detail page (Contact, Lead, Opportunity)
2. Open Email Composer
3. Enter recipient, subject, body
4. Click Send
5. Verify `POST /api/integrations/microsoft/mail/send` returns 200

**Expected:** Email sent via `POST /me/sendMail`. CRM activity, timeline entry, and notification created.

**Status:** NOT TESTED

### 6. Verify Recipient Received Email

**Steps:**
1. Check recipient's inbox
2. Confirm email arrived with correct subject, body, sender

**Expected:** Email delivered via Microsoft Graph.

**Status:** NOT TESTED (requires external email account)

### 7. Verify Outlook Sent Items

**Steps:**
1. Open Outlook Web
2. Check Sent Items folder
3. Confirm email appears

**Expected:** Email saved to Sent Items (controlled by `saveToSentItems: true`).

**Status:** NOT TESTED

### 8. Save Draft

**Steps:**
1. Open Email Composer
2. Enter recipient, subject, body (do not send)
3. Click Save Draft (or close with unsaved changes → Save)
4. Verify `POST /api/integrations/microsoft/mail/drafts` returns 201

**Expected:** Draft created via `POST /me/mailFolders/drafts/messages`.

**Status:** NOT TESTED

### 9. Verify Outlook Drafts

**Steps:**
1. Open Outlook Web
2. Check Drafts folder
3. Confirm draft appears with correct content

**Expected:** Draft visible in Outlook Drafts.

**Status:** NOT TESTED (requires Outlook Web access)

### 10. Inbox

**Steps:**
1. Open Email Timeline on any entity
2. Verify emails load from inbox
3. Verify `GET /api/integrations/microsoft/mail/messages?folder=inbox` returns 200

**Expected:** Real inbox emails displayed. No mock data when Graph is enabled.

**Status:** NOT TESTED

### 11. Reply

**Steps:**
1. In Email Timeline, click Reply on an email
2. Enter reply body
3. Send
4. Verify `POST /api/integrations/microsoft/mail/{id}/reply` returns 200

**Expected:** Reply sent via `POST /me/messages/{id}/reply`.

**Status:** NOT TESTED

### 12. Reply All

**Steps:**
1. In Email Timeline, click Reply All on an email with multiple recipients
2. Enter reply body
3. Send
4. Verify `POST /api/integrations/microsoft/mail/{id}/reply-all` returns 200

**Expected:** Reply all sent via `POST /me/messages/{id}/replyAll`.

**Status:** NOT TESTED

### 13. Forward

**Steps:**
1. In Email Timeline, click Forward on an email
2. Enter recipient and comment
3. Send
4. Verify `POST /api/integrations/microsoft/mail/{id}/forward` returns 200

**Expected:** Forward sent via `POST /me/messages/{id}/forward`.

**Status:** NOT TESTED

### 14. Create Normal Outlook Event

**Steps:**
1. Open Activities > Calendar
2. Click Create Event
3. Enter subject, date, time, location
4. Do NOT check Teams Meeting
5. Save
6. Verify `POST /api/integrations/microsoft/calendar/events` returns 201

**Expected:** Event created via `POST /me/events`.

**Status:** NOT TESTED

### 15. Verify Calendar Event

**Steps:**
1. After creating event, refresh calendar
2. Verify event appears in correct date/time slot
3. Open event details

**Expected:** Event visible in calendar.

**Status:** NOT TESTED

### 16. Verify Attendee Invitation

**Steps:**
1. Create event with an attendee email
2. Check attendee's calendar or inbox for invitation

**Expected:** Attendee receives calendar invitation via Exchange.

**Status:** NOT TESTED (requires guest attendee)

### 17. Create Teams Meeting

**Steps:**
1. Open Calendar
2. Click Create Event
3. Enter subject, date, time
4. Check Teams Meeting toggle
5. Save
6. Verify `POST /api/integrations/microsoft/calendar/events` sends `isOnlineMeeting: true` + `onlineMeetingProvider: "teamsForBusiness"`

**Expected:** Event created with Teams meeting. Response includes `onlineMeeting.joinUrl`.

**Status:** NOT TESTED

### 18. Verify Real Teams Join URL

**Steps:**
1. After creating Teams-backed event
2. Open event details
3. Verify Join URL is a real `https://teams.microsoft.com/l/meetup-join/...` URL
4. Verify it was NOT generated locally

**Expected:** Join URL comes from Microsoft Graph `onlineMeeting.joinUrl` — not client-generated.

**Status:** NOT TESTED

### 19. Join Teams

**Steps:**
1. Click Join Meeting button
2. Verify Teams client or web opens

**Expected:** Join URL opens Teams.

**Status:** NOT TESTED (requires Teams client)

### 20. Open Event in Outlook

**Steps:**
1. Open event details
2. Click Open in Outlook
3. Verify Outlook Web opens to the correct event

**Expected:** Outlook web link from Graph response navigates to correct event.

**Status:** NOT TESTED

### 21. Edit Event

**Steps:**
1. Open existing event
2. Click Edit
3. Change subject, time, or location
4. Save
5. Verify `PATCH /api/integrations/microsoft/calendar/events/{id}` returns 200

**Expected:** Event updated via `PATCH /me/events/{id}`.

**Status:** NOT TESTED

### 22. Cancel Event

**Steps:**
1. Open existing event
2. Click Delete / Cancel
3. Confirm deletion
4. Verify `DELETE /api/integrations/microsoft/calendar/events/{id}` returns 200

**Expected:** Event deleted via `DELETE /me/events/{id}`.

**Status:** NOT TESTED

### 23. Missing-Permission Behavior

**Steps:**
1. Remove a delegated permission from the app registration (e.g., `Presence.Read`)
2. Wait for token expiry or re-authenticate
3. Test affected feature (e.g., presence)
4. Verify error message is descriptive and safe (no token exposure)

**Expected:** API returns a safe provider error. No raw Graph error body with tokens.

**Status:** NOT TESTED (requires Azure app registration change)

### 24. Expired-Token Behavior

**Steps:**
1. Wait for access token to expire (~1 hour)
2. Make any Graph API request
3. Verify refresh flow runs (check Network tab)
4. If refresh fails, verify "Reauthentication Required" message

**Expected:** Silent token refresh or clear reauthentication error.

**Status:** NOT TESTED

### 25. Mock Mode Behavior

**Steps:**
1. Set `NEXT_PUBLIC_USE_MICROSOFT_GRAPH=false`
2. Restart dev server
3. Navigate to all integration features
4. Verify Mock Mode is visibly displayed
5. Verify no actual Microsoft Graph calls are made
6. Verify no fake Teams links
7. Verify no false "Connected" status

**Expected:** Mock mode shows explicitly. No Graph calls. No fake Teams URLs.

**Status:** NOT TESTED

---

## Status Legend

- **PASS** — Tested and verified correct
- **FAIL** — Tested and behavior is incorrect
- **NOT TESTED** — Not yet executed
- **REQUIRES USER CONFIRMATION** — Needs someone with specific access to verify
