# CORTA API Contract

Wire format the web frontend codes against. JSON over HTTPS, base path `/api`
(Next.js rewrites it to core-api — see `next.config.ts`).

Auth: `Authorization: Bearer <access_token>` on protected routes. The refresh
token is an httpOnly cookie only, so every call uses `credentials: "include"`.
Errors return a plain-text body with the HTTP status, not JSON.

**Implementation status.** Anything not marked *live* is answered by the
in-browser mock server in `src/mocks/`. Switch a module over with
`NEXT_PUBLIC_LIVE_MODULES`. The gaps in core-api are tracked in `PLAN.md` §10.

The TypeScript mirror of everything below is `src/lib/types.ts`.

---

## Access model

Three tiers, each strictly bounded:

| Tier | Governs | Cannot read |
|---|---|---|
| `SUPER_ADMIN` (platform) | organisations: approve, reject, suspend, reinstate | anything inside a tenant |
| `ORG_ADMIN` | teams, resources, people, org settings | any team's board, chat, documents or files |
| `TEAM_LEADER` / `TEAM_MEMBER` | their own team's content | other teams |

Team content endpoints (`/teams/{teamId}/board|chat|docs|files`) must return
**403** to anyone who is not a member of that team, whatever their org or
platform role. The roster (`/teams/{teamId}/members`) is the one exception: org
admins may read and change it, because they assign team leaders.

---

## Auth

### `POST /auth/login`
```json
{ "email": "", "password": "" }
// → 200 AuthResponse | 401 text
```

### `POST /auth/register`
```json
{ "mode": "individual"|"create_org"|"join_org", "name": "", "email": "", "password": "",
  "org_name": "", "org_public_id": "", "fields": { "student_id": "" } }
// → 200 AuthResponse | 404 unknown org | 409 email taken / org not active
```
`individual` registers a standard user account without creating or joining an organisation.
`create_org` registers a new tenant with `status: "pending"`; it stays unusable
until a platform operator approves it. `join_org` only accepts an **active** org.

### `POST /auth/refresh` → AuthResponse · `POST /auth/logout` → 204
### `GET /me` → AuthUser
### `GET /orgs/lookup/{publicId}` → `{ name, public_id, registration_fields }`
Public: the registration form uses it to discover an org's extra fields.

```ts
AuthResponse = { access_token: string, user: AuthUser }
AuthUser = { id, org_id, email, name, org_role: "ORG_ADMIN"|"ORG_MEMBER",
             platform_role: "SUPER_ADMIN"|null, avatar_url? }
```

**Live today:** `POST /users/login` returning `{ token, user }`. Adapted in
`src/features/auth/api.ts`. There is no refresh endpoint yet.

---

## Platform (`SUPER_ADMIN` only)

### `GET /platform/orgs` → `Organization[]`
### `PATCH /platform/orgs/{orgId}` → Organization
```json
{ "status": "pending"|"active"|"suspended"|"rejected" }
```

```ts
Organization = {
  id, name, public_id, status, owner_name, owner_email,
  user_count, team_count, requested_at, decided_at?
}
```
No route on this tier may expose team, chat, document or file data.

---

## Teams

### `GET /orgs/{orgId}/teams` → `Team[]`
Org admins see every team in the org; everyone else sees only their own. `my_role`
is `undefined` for non-members, and the UI uses that to withhold a way in.

### `POST /orgs/{orgId}/teams` `{ name, description?, leader_user_id }` (ORG_ADMIN)
### `GET /teams/{teamId}` → Team
### `PATCH /teams/{teamId}` `{ name?, description? }` (TEAM_LEADER)
### `DELETE /teams/{teamId}` → 204 (ORG_ADMIN)
### `GET /teams/{teamId}/members` → `TeamMember[]` (members + ORG_ADMIN)
### `POST /teams/{teamId}/members` `{ email }` (TEAM_LEADER)

The email must belong to an existing member of the team's organisation.

### `DELETE /teams/{teamId}/members/{userId}` → 204 (TEAM_LEADER)
### `PUT /teams/{teamId}/leader` `{ user_id }` → `TeamMember[]` (ORG_ADMIN)
### `POST /teams/{teamId}/leave` → 204 — 409 for a leader (SRS 3.1.2.7)
### `GET /orgs/{orgId}/users` → `OrgUser[]`

```ts
Team = { id, public_id, org_id, name, description?, my_role?, member_count, created_at }
TeamMember = { user_id, name, email, avatar_url?, role, joined_at }
OrgUser = { id, email, name, org_role, avatar_url? }
```

**Live today:** `GET/POST /teams` scoped by an `X-Org-ID` header, returning
`{ id, name, slug }`. No membership, update or delete routes.

---

## Board — members only

### `GET /teams/{teamId}/board` → `{ columns, tasks }`
### `POST /teams/{teamId}/board/tasks` → Task
### `PATCH /teams/{teamId}/board/tasks/{taskId}` → Task
Accepts any Task field plus `position`, the index within `column_id`. Drag and
drop sends `{ column_id, position }`.
### `DELETE /teams/{teamId}/board/tasks/{taskId}` → 204

```ts
Column = { id, title, task_ids: string[] }
Task = { id, column_id, title, description, assignee_id, priority: "low"|"medium"|"high",
         start_date, due_date, tags: string[], created_at }
```

**Live today:** `GET/POST/PATCH/DELETE /v1/orgs/{org_id}/teams/{team_id}/tasks`, where a task is
`{ id, description, status, assignee_id, created_at, updated_at }`. There is no priority, due date
or tags, and no ordering. `assignee_id` is the user UUID; PATCH treats an absent `assignee_id` as
"keep", an explicit `null` as unassign, and a value as reassign. Team members resolve assignees via
`/v1/orgs/{org_id}/teams/{team_id}/members`. The UI folds the flat status list (todo/in_progress/done)
into three columns — Review is not offered because the backend cannot store it — maps assignees to
the roster numeric key, and reports the missing fields rather than pretending.

---

## Chat — members only

### `GET /teams/{teamId}/chat/messages?limit=&before=` → `{ messages }`
### `POST /teams/{teamId}/chat/messages` `{ message, reply_to_id?, mentions? }`
### `DELETE /teams/{teamId}/chat/messages/{messageId}`
Own message, or any message if the caller is the team leader; returns
`{ id, channel_id, deleted_at }` (soft delete).

```ts
ChatMessage = { id, channel_id, sender: { id, name, avatar_url? },
                reply_to_id?, mentions?: number[], message, created_at, deleted_at? }
```

Realtime: `socket-server` at `ws://…/ws?token=&team_id=` is expected to push
`{ type: "message.created"|"message.deleted", data: ChatMessage }`. The client
subscribes only when `NEXT_PUBLIC_WS_BASE_URL` is set. Core-api commits each
chat write, publishes the event to `corta:chat:events`, and socket-server fans
it out to the matching team room.

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
