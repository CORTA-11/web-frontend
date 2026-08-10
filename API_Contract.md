# CORTA API Contract

Wire format for `core-api` (JSON over HTTPS). Base path: `/api`.

**Frontend status:** all modules currently use in-memory mocks under `src/lib/mock/` + `src/lib/api/*` (no live core-api calls). Dummy logins: `admin@aratuwa.edu` / `leader@aratuwa.edu` / `member@aratuwa.edu`, password `password123`. Join-org public id: `aratuwa`.

Auth: `Authorization: Bearer <access_token>` on protected routes. Refresh token is httpOnly cookie only (`credentials: "include"`). Errors return plain text body + HTTP status (not JSON).

Frontend client wraps success as `{ success: true, data }` and failure as `{ success: false, error }`.

---

## Auth (mocked)

### `POST /auth/register`
```json
// request
{ "mode": "create_org"|"join_org", "name": "", "email": "", "password": "",
  "org_name": "", "org_public_id": "" }
// response 200
{ "access_token": "", "user": { "id": 1, "org_id": 1, "email": "", "name": "",
  "org_role": "ORG_ADMIN"|"ORG_MEMBER", "avatar_url": "" } }
```

### `POST /auth/login`
```json
{ "email": "", "password": "" }
// → same AuthResponse as register
```

### `POST /auth/refresh` → AuthResponse  
### `POST /auth/logout` → 204  
### `GET /me` → AuthUser

---

## Teams (mocked)

### `GET /orgs/{orgId}/teams` → `Team[]`
### `POST /orgs/{orgId}/teams`
```json
{ "name": "", "description": "", "leader_user_id": 2 }
```
### `GET /teams/{teamPublicId}` → Team  
### `GET /teams/{teamPublicId}/members` → `TeamMember[]`  
### `POST /teams/{teamPublicId}/members` `{ "user_id": 3 }`  
### `DELETE /teams/{teamPublicId}/members/{userId}`  
### `PUT /teams/{teamPublicId}/leader` `{ "user_id": 2 }`  
### `POST /teams/{teamPublicId}/leave`  
### `GET /orgs/{orgId}/users` → `OrgUser[]`

```ts
Team = { id, public_id, org_id, name, description?, my_role?, created_at }
TeamMember = { user_id, name, email, avatar_url?, role, joined_at }
OrgUser = { id, email, name, org_role, avatar_url? }
```

---

## Chat (mocked)

### `GET /teams/{teamPublicId}/chat/messages?limit=&before=`
```json
{ "messages": [ChatMessage] }
```
### `POST /teams/{teamPublicId}/chat/messages`
```json
{ "message": "", "reply_to_id": null }
```
### `DELETE /teams/{teamPublicId}/chat/messages/{messageId}`
```json
{ "id": "", "channel_id": "", "deleted_at": "" }
```

```ts
ChatMessage = {
  id, channel_id,
  sender: { id, name, avatar_url? },
  reply_to_id?, message, created_at, deleted_at?
}
```

---

## Board / Kanban (planned — mock in `src/lib/mock` + `src/lib/api/board.ts`)

### `GET /teams/{teamPublicId}/board`
```json
{ "columns": [Column], "tasks": [Task] }
```
### `POST /teams/{teamPublicId}/board/tasks`
```json
{ "column_id": "", "title": "", "description": "", "assignee_id": null,
  "priority": "low"|"medium"|"high", "due_date": null, "tags": [] }
```
### `PATCH /teams/{teamPublicId}/board/tasks/{taskId}`
```json
{ "column_id": "", "title": "", "description": "", "assignee_id": null,
  "priority": "low"|"medium"|"high", "due_date": null, "tags": [], "position": 0 }
```
### `DELETE /teams/{teamPublicId}/board/tasks/{taskId}` → 204

```ts
Column = { id, title, task_ids: string[] }
Task = {
  id, column_id, title, description, assignee_id,
  priority: "low"|"medium"|"high", due_date, tags: string[], created_at
}
```

---

## Resources (planned — mock in `src/lib/mock` + `src/lib/api/resources.ts`)

### `GET /orgs/{orgId}/resources` → `Resource[]`
### `POST /orgs/{orgId}/resources` (ORG_ADMIN)
```json
{ "name": "", "type": "gpu"|"sensor"|"room"|"workstation",
  "location": "", "enabled": true }
```
### `PATCH /orgs/{orgId}/resources/{resourceId}` (ORG_ADMIN)
### `DELETE /orgs/{orgId}/resources/{resourceId}` (ORG_ADMIN) → 204
### `POST /orgs/{orgId}/resources/{resourceId}/requests` (TEAM_LEADER)
```json
{ "team_public_id": "", "start_time": "", "end_time": "", "purpose": "" }
```
### `GET /orgs/{orgId}/resource-requests` → `ResourceRequest[]`
### `PATCH /orgs/{orgId}/resource-requests/{requestId}` (ORG_ADMIN)
```json
{ "status": "approved"|"rejected" }
```

```ts
Resource = {
  id, org_id, name, type, location, enabled, bookings: Booking[]
}
Booking = { id, resource_id, user_id, team_public_id?, start_time, end_time, purpose }
ResourceRequest = {
  id, resource_id, team_public_id, requested_by, start_time, end_time,
  purpose, status: "pending"|"approved"|"rejected", created_at
}
```

---

## Collaborative docs (planned — mock in `src/lib/mock` + `src/lib/api/documents.ts`)

### `GET /teams/{teamPublicId}/docs` → `DocSummary[]`
### `POST /teams/{teamPublicId}/docs` `{ "title": "" }`
### `GET /teams/{teamPublicId}/docs/{docId}` → Doc
### `PATCH /teams/{teamPublicId}/docs/{docId}` `{ "title": "", "content": "" }`
### `DELETE /teams/{teamPublicId}/docs/{docId}` (TEAM_LEADER) → 204

```ts
DocSummary = { id, team_public_id, title, updated_at, updated_by }
Doc = { ...DocSummary, content } // rich-text JSON / HTML string for now
```
