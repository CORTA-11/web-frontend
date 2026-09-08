# CORTA Web Frontend — Plan and Delivered State

Scope: `web-frontend/`. Related live contracts delivered by `core-api` and
`socket-server` are identified where they replace earlier frontend mocks.

**Status: all phases built.** 31 isolated Playwright scenarios and the live
multi-context Document Presence scenario pass; `npm run build` and `tsc --noEmit`
are clean.

---

## 1. Approach

- **Evolved the existing app in place.** Routes, shadcn primitives and the
  Playwright setup stayed. The data layer and the styling were replaced.
- **Library-first.** Anything a maintained library does well was installed rather
  than written.
- **Contract-first.** The frontend codes against `API_Contract.md`; an in-browser
  mock server answers whatever core-api has not shipped. Going live is one env
  var per module, not a rewrite.

## 2. Architecture

```text
src/
  app/                    # routes only — params in, one feature component out
  features/<module>/      # api.ts · queries.ts · components/  (one vertical each)
  components/ui|layout|common/
  lib/                    # http · types · rbac · format · env · query-keys · crypto · keystore
  mocks/                  # MSW: db · seed · handlers · guards
```

- `lib/http.ts` is the only place that touches `fetch`. It throws `ApiError`;
  React Query owns loading and error state from there.
- `lib/types.ts` is the typed mirror of `API_Contract.md`, imported by both
  feature code and mock handlers so the two cannot drift.
- Adapters for core-api's actual shapes live in the relevant `api.ts` and nowhere
  else, each with a comment saying what is missing.
- `NEXT_PUBLIC_LIVE_MODULES=auth,teams,board,files,docs` makes those modules skip the
  mock server. Everything unlisted stays mocked.

## 3. Libraries added

| Need | Library | Replaces |
|---|---|---|
| Server state, cache, optimistic updates | `@tanstack/react-query` | ~40 hand-written fetch/loading/error blocks |
| API mocking at the network level | `msw` | the old `src/lib/mock/*` and its dual code paths |
| Kanban drag and drop | `@dnd-kit/core`, `sortable`, `utilities` | column moves, with keyboard dragging for free |
| Forms and validation | `react-hook-form`, `zod`, `@hookform/resolvers` | per-field state; dynamic registration fields become a generated schema |
| Collaborative rich text | Tiptap + Collaboration/Caret, Yjs, Hocuspocus provider | the document editor and Presence |
| Booking calendar | `react-big-calendar` + `date-fns` | multi-resource day view |
| Dates and durations | `date-fns` | hand-rolled formatting |
| Toasts | `sonner` | ad-hoc banner state |

Removed as unused: `zustand` (the session is a React Query entry, so no store was
needed) and `next-themes` (light theme only).

## 4. Design

Light theme only, "lab instrument": 3px radius, IBM Plex Sans + Plex Mono, one
desaturated slate-blue accent, hairline borders instead of shadows, 13px body at
32px row density. Status reads as a dot plus a word or a 2px left rule, never a
filled pill. Digits are `tabular-nums`; IDs, codes, sizes and timestamps are
mono. No gradients, hero sections, emoji or sparkle icons on AI actions — AI
buttons say what they do and show which model ran. Mock data is lab-specific
(`A100 node 2`, `Confocal microscope (Zeiss LSM 900)`) rather than `Project Alpha`.

## 5. The three-tier privacy model

This is the part the product name is about, so it is enforced twice — in the mock
server and in the UI — and covered by its own test spec.

| Tier | Governs | Cannot read |
|---|---|---|
| Platform operator (`SUPER_ADMIN`) | organisations: approve, reject, suspend, reinstate | anything inside a tenant |
| Organisation admin | teams, resources, people, org settings | any team's board, chat, documents or files |
| Team leader / member | their own team's content | other teams |

- `src/mocks/guard.ts` wraps every team-content route: a non-member gets 403
  whatever their org or platform role. The roster is the single widening — org
  admins read and change it, because they assign team leaders.
- `TeamMembersOnly` and `OrgGate` state the same rule in the UI, so a non-member
  sees an explanation rather than a broken page.
- The sidebar lists only the teams you belong to. An admin sees every team in the
  Teams table, without a link into any workspace they are not part of.
- A new organisation registers as `pending` and is unusable until a platform
  operator approves it.

`SUPER_ADMIN` is an extension beyond the SRS, which defines only Organisation
Admin, Team Leader and Team Member (§1.3). It is worth adding to §1.3 of the SRS
if the platform tier stays.

## 6. SRS → screen map

**L** live core-api · **M** mock · **P** platform tier (beyond the SRS).

| SRS | Screen | Route | API |
|---|---|---|---|
| 3.1.1.1–2 | Login, register (create / join org) | `/login`, `/register` | L (login), M |
| 3.1.1.3 | Registration field builder | `/orgs/{org}/settings` | M |
| 3.1.2.1–7 | Teams table, members, leader, rename, leave | `/orgs/{org}/teams…` | L (list/create), M |
| 3.1.3.1–6 | Resource CRUD, availability, calendar, requests, approvals | `/orgs/{org}/resources` | M |
| 3.1.4.1–4 | Chat: send, reply, mention, delete | `…/{team}/chat` | M (+ WS when configured) |
| 3.1.5.1, 3.1.5.3 | Notification preferences | `/orgs/{org}/notifications` | M |
| 3.1.6.1–3 | File upload, list, download, delete | `…/{team}/files` | L |
| 3.1.7.1–4 | Kanban with drag, priority, assignee, dates | `…/{team}/board` | L (list/create), M |
| 3.1.8.1–5 | Collaborative Documents with Presence and leader-only delete | `…/{team}/docs` | L |
| 3.1.9.1–3 | Chat summary, transcript summary, task extraction | dialogs in chat and docs | M |
| 3.1.9 (admin) | AI enable/disable, model or custom endpoint | `/orgs/{org}/settings` | M |
| 3.5.4.1–2 | Tenant and team isolation | everywhere | enforced both sides |
| — | Organisation approval console | `/admin` | P |

Not on web, per SRS 3.1.10: push notifications, private sticky notes, quick capture.

## 7. What was built, phase by phase

| Phase | Delivered |
|---|---|
| 0 Foundations | Tokens, fonts, `AppShell`, `http`/`rbac`/`format`/`env`, React Query, MSW with a full lab-flavoured seed; old mock layer deleted |
| 1 Auth | Login, register with create/join modes, dynamic registration fields, session as a query, guards |
| 2 Teams | Teams table, create dialog, roster, add/remove, leader assignment, rename, leave rules |
| 3 Board | dnd-kit board with optimistic moves and keyboard dragging, task dialog, assignee filter |
| 4 Chat | Grouped message list, day separators, replies, `@` mention autocomplete, delete rules, WS hook behind a flag |
| 5 Resources | Admin CRUD with weekly availability windows, multi-resource calendar, slot requests with clash warning, approval queue with server-side conflict rejection |
| 6 Docs & files | Tiptap/Yjs collaboration with title/body Presence and offline merge, leader-only delete; upload/download/delete with drag-and-drop |
| 7 AI | Chat summary over a date range, transcript summary with follow-up question, task extraction into an editable review table |
| 8 Console & polish | Org settings, people, notifications, org overview, platform console, privacy gates, 31 Playwright specs |
| 9 File encryption | AES-256-GCM envelope in `lib/crypto.ts`, browser-held key in `lib/keystore.ts`; files are sealed before upload and opened after download |

**Size:** ~7,400 lines under `src/`, of which ~1,100 is the mock server that
deletes itself as the backend lands. That is above the 5,000-line target set
before the platform tier, the privacy gates and the AI module were added; every
file is still under 200 lines except `lib/types.ts` (the contract mirror, which
declares no behaviour and is a documented exception in `AGENTS.md`).

## 8. Backend asks

Nothing here is worked around; the affected module stays mocked until it lands.

1. `POST /auth/refresh` with an httpOnly refresh cookie, and a register endpoint
   that creates or joins an organisation. Today's `POST /users/login` returns a
   bare token with no rotation (SRS 3.5.1.3).
2. Task fields `status`, `assignee_id`, `priority`, `due_date`, plus `PATCH` and
   `DELETE`. The Kanban is unbuildable as specified without them (SRS 3.1.7).
3. Chat REST **and** publishing to `corta:chat:events` — socket-server is already
   built and currently receives nothing.
4. Team member endpoints, leader assignment, team rename and delete.
5. Resources, bookings and the approval workflow, including **server-side**
   conflict rejection (SRS 2.4). The client-side check is advisory only.
6. Context service endpoints for summarise and extract (SRS 3.1.9).
7. Platform tier: organisation records with a status, and the approve / suspend
   routes behind a platform role.
8. **Membership checks on every team-content route.** The frontend enforces the
   privacy model, but the server is the authority — an org admin calling
   `GET /teams/{id}/chat/messages` directly must get a 403.
9. **SRS 3.5.3.3 says all encryption and decryption happen on the client.**
    Files now are: `lib/crypto.ts` seals them with AES-256-GCM before upload and
    opens them after download, so core-api only ever sees ciphertext and a
    `application/vnd.corta.encrypted` content type. What is still missing is key
    management (SRS 3.5.3.4) — every browser seeds the *same fixed development
    key* from `lib/keystore.ts`, because generation, wrapping, per-team exchange
    and rotation need a decision across frontend, core-api and mobile. Until
    that lands this is encryption at rest on the server, not end-to-end
    encryption, and the Files screen says only "AES-256-GCM in this browser".
    Board, chat and document content is still stored in the clear.

## 9. Known limits

- Chat mentions use a plain textarea with an autocomplete rather than TipTap's
  mention extension: messages stay plain text, which matches the contract and is
  less code. TipTap is used for documents only.
- Document title and body use one Yjs Document and one Hocuspocus connection;
  authenticated Presence is ephemeral and offline changes merge on reconnect.
- `react-big-calendar` shows resource columns in Day view only; Week and Agenda
  views combine resources.
- The mock server resets on page reload — it is in-memory by design.
