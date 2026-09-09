# CORTA API Contract — Feature modules

Continuation of [`API_Contract.md`](API_Contract.md). The same JSON, authentication,
error, and access-model conventions apply.

---

## Documents — Team Members only

When `NEXT_PUBLIC_LIVE_MODULES` includes `docs`, the catalog uses core-api:

### `GET /api/v1/orgs/{orgId}/teams/{teamId}/documents` → `{ items: DocumentSummary[] }`
### `POST /api/v1/orgs/{orgId}/teams/{teamId}/documents` `{ title }` → `DocumentSummary`
### `GET /api/v1/orgs/{orgId}/teams/{teamId}/documents/{documentId}` → `DocumentProjection`
### `PATCH /api/v1/orgs/{orgId}/teams/{teamId}/documents/{documentId}` `{ title?, body_html? }` → `DocumentProjection`
### `DELETE /api/v1/orgs/{orgId}/teams/{teamId}/documents/{documentId}` → 204 (TEAM_LEADER)
### `POST /api/v1/orgs/{orgId}/teams/{teamId}/documents/{documentId}/socket-ticket` → `{ token }`

All routes require an authenticated Team Member. Create, patch, delete, and
ticket issuance also require the CSRF token; none has an application rate
limit. Create and patch accept at most 64 KiB of JSON, while the other routes
accept no request body. The catalog is ordered by recent activity. Canonical
Yjs state is never included in browser REST responses. The projection contains
the latest persisted title and rich-text body.

The socket ticket is valid for 60 seconds and binds the Editor, organization,
team, and Document. The browser connects to
`{NEXT_PUBLIC_WS_BASE_URL}/ws/docs?org_id={orgId}&team_id={teamId}`, passes the
ticket as the Hocuspocus token, and uses
`{orgId}:{teamId}:{documentId}` as the Document name. The service rejects an
invalid or expired ticket, mismatched scope, non-member Editor, and unapproved
Origin. Title and body share one Yjs Document; authenticated Presence and
offline reconnect merge run over the same connection. Core-api remains the
durable source of truth through private state endpoints that are never called
by the browser.

```ts
DocumentSummary = { id, team_id, title, updated_by, created_at, updated_at }
DocumentProjection = { ...DocumentSummary, body_html }
```

When `docs` is not live, MSW still provides the isolated UI-test fixture below.
It is a test/dev fallback, not the deployed collaboration transport.

### `GET /teams/{teamId}/docs` → `DocSummary[]`
### `POST /teams/{teamId}/docs` `{ title }` → Doc
### `GET /teams/{teamId}/docs/{docId}` → Doc
### `PATCH /teams/{teamId}/docs/{docId}` `{ title?, content? }` → Doc
### `DELETE /teams/{teamId}/docs/{docId}` → 204 (TEAM_LEADER)

```ts
DocSummary = { id, team_public_id, title, updated_at, updated_by }
Doc = DocSummary & { content }  // HTML from the rich-text editor
```
The mock editor persists `content` through this fixture. Live mode does not poll
or PATCH on an interval; Yjs updates synchronize through the Document Room and
the collaboration service persists bounded canonical snapshots to core-api.

---

## Files — members only

### `GET /teams/{teamId}/files` → `StoredFile[]`
### `POST /teams/{teamId}/files/upload` — `multipart/form-data`, field `file`
### `GET /teams/{teamId}/files/download/{fileId}` → the bytes
### `DELETE /teams/{teamId}/files/{fileId}` → 204 — uploader or team leader

```ts
StoredFile = { id, name, size, content_type, uploaded_by, uploaded_by_name, uploaded_at }
```

**Live today:** `GET /{teamSlug}/files`, `POST /{teamSlug}/files/upload`,
`GET /{teamSlug}/files/download/{filename}` with `X-Org-ID`. No delete, and no
uploader attribution.

---

## Resources

These routes are live at `/api/v1`. List responses use `{ "items": [...] }`;
the frontend adapter unwraps them.

### `GET /orgs/{orgId}/resources` → `{ items: Resource[] }`
### `POST /orgs/{orgId}/resources` (ORG_ADMIN or owner)
### `PATCH /orgs/{orgId}/resources/{resourceId}` (ORG_ADMIN or owner)
### `DELETE /orgs/{orgId}/resources/{resourceId}` → 204 (ORG_ADMIN or owner)
### `GET /orgs/{orgId}/bookings` → `{ items: Booking[] }`
### `POST /orgs/{orgId}/resources/{resourceId}/requests` (the team's TEAM_LEADER)
```json
{ "team_public_id": "", "start_time": "", "end_time": "", "purpose": "" }
```
### `GET /orgs/{orgId}/resource-requests` → `{ items: ResourceRequest[] }`
### `PATCH /orgs/{orgId}/resource-requests/{requestId}` (ORG_ADMIN or owner)
```json
{ "status": "approved"|"rejected" }
```
Only approval creates a booking. Approval returns 409 when the resource is
disabled, the UTC availability has changed, or an approved interval overlaps.
Resources with request history cannot be deleted. Other-team bookings expose
only resource/time plus `details_visible: false`; all detail fields are null.

```ts
Resource = { id, org_id, name, code, kind: "gpu"|"instrument"|"room"|"workstation",
             location, enabled, availability: AvailabilityWindow[] }
AvailabilityWindow = { weekday: 0-6, start: "08:00", end: "22:00" }
Booking = { id, resource_id, resource_name, start_time, end_time, details_visible,
            team_public_id: string|null, team_name: string|null,
            requested_by_name: string|null, purpose: string|null }
ResourceRequest = { id, resource_id, resource_name, team_public_id, team_name,
                    requested_by, requested_by_name, start_time, end_time, purpose,
                    status: "pending"|"approved"|"rejected", created_at, decided_at? }
```

---

## Settings and notifications

### `GET /orgs/{orgId}/settings` → OrgSettings
### `PATCH /orgs/{orgId}/settings` (ORG_ADMIN)
### `GET /notification-prefs` → NotificationPrefs
### `PUT /notification-prefs` → NotificationPrefs

```ts
OrgSettings = { org_id, name, public_id, status, registration_fields, ai }
RegistrationField = { key, label, type: "text"|"email"|"number"|"select", required, options? }
AiSettings = { enabled, provider: "builtin"|"custom", model, available_models, custom_endpoint? }
NotificationPrefs = { mode: "all"|"mentions"|"off", email_enabled, email_address }
```

---

## AI (context service) — members only

### `POST /teams/{teamId}/ai/chat-summary` `{ from?, to? }` → AiSummary
### `POST /teams/{teamId}/ai/transcript-summary` `{ transcript, question? }` → AiSummary
### `POST /teams/{teamId}/ai/extract-tasks` `{ transcript? } | { from, to }` → `{ tasks }`

All three return 403 when the org has AI disabled. Extraction is offered to team
leaders only (SRS 3.1.9.3); the suggestions stay editable until someone accepts
them onto the board.

```ts
AiSummary = { id, headline, bullets: string[], decisions: string[],
              model, generated_at, source_count }
ExtractedTask = { title, description, assignee_id, priority, start_date, due_date, evidence }
```
