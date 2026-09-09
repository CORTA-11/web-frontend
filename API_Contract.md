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

## Feature module contracts

Documents, files, resources, AI, settings, notifications, and shared type
contracts continue in [`API_Contract_Modules.md`](API_Contract_Modules.md).
