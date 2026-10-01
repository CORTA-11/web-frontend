# Google Calendar task export

Assigned tasks can be added to Google Calendar from the **Assigned to you** overview list or the task's edit dialog. In the edit dialog, the action is shown only for tasks assigned to the signed-in user.

1. Save a start date and/or due date on the task.
2. Select **Add to Google Calendar** (the calendar icon in the overview).
3. Review the sharing notice, then select **Open Google Calendar**.
4. Review the event in Google Calendar and save it. Google may ask you to sign in.

The event includes the saved task title, description and a link to the team board. Unsaved edits are not included. The board link still requires the app's normal sign-in and team membership; exporting does not change access permissions. Avoid exporting sensitive team details to calendars shared with others.

## Dates

Events are all-day. A start and due date create a range including both days; a single date creates a one-day event. If the start is after the due date, only the deadline is exported. Dates match the task editor's date-only values rather than being converted into the viewer's timezone. Tasks without a valid date cannot be exported.

## Scope and setup

This uses Google's event-template URL. It requires no OAuth client, API key or Google-specific environment configuration. Nothing is sent to Google until the user chooses **Open Google Calendar**.

Live task dates require core-api's task-date support and tenant migration `000018_add_task_dates`. Reconcile existing tenant schemas with the updated provisioner and verify every tenant is current before deploying the updated API, then deploy this frontend. Older backend versions do not persist dates; dates previously discarded must be entered and saved again.

This is a one-time copy, not synchronization. Editing or deleting a task does not update the event. Users must make subsequent changes in Google Calendar; repeated exports may create duplicate events. The app cannot determine whether the event was saved. This creates Calendar events, not Google Tasks entries.

## Validation

- `npm run test:unit`: calendar URL encoding and date-range edge cases.
- `npx playwright test tests/google-calendar.spec.ts`: export from task details and overview, sharing notice, missing dates, and assignee visibility (no Google network access required).
