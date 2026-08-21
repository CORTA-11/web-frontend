# Agent Rules & Guidelines

Design patterns, code quality and development guidelines for `web-frontend`.
All changes must conform to these rules.

## 1. Directory structure

```text
web-frontend/
├── src/
│   ├── app/                  # routes only — params in, one feature component out
│   │   ├── login/  register/
│   │   ├── admin/            # platform operator console
│   │   └── orgs/[orgId]/     # tenant shell (guarded)
│   ├── features/             # one folder per module, owns its whole vertical
│   │   └── <module>/
│   │       ├── api.ts        # typed endpoint functions + live adapters
│   │       ├── queries.ts    # useQuery / useMutation hooks
│   │       └── components/
│   ├── components/
│   │   ├── ui/               # shadcn primitives — generated, never hand-edited
│   │   ├── layout/           # AppShell, Sidebar, Header, ProfileMenu
│   │   └── common/           # QueryBoundary, PageHeader, EmptyState, Field
│   ├── lib/                  # http, types, rbac, format, env, query-keys, crypto
│   └── mocks/                # MSW server: db, seed, handlers, guards
├── tests/                    # Playwright specs
└── next.config.ts            # /api → core-api proxy
```

Feature-first, not layer-first: everything a module needs sits in one folder, so
a module is one person's diff.

## 2. Data layer

- **One HTTP boundary.** `lib/http.ts` is the only place that touches `fetch`.
  It throws `ApiError`; React Query owns loading and error state from there.
- **No dual code paths.** Mocks live in `src/mocks` at the network level, never
  inside feature code. `NEXT_PUBLIC_LIVE_MODULES` decides, per module, whether a
  request is answered by MSW or falls through to core-api.
- **Adapters are isolated.** Where core-api's shape differs from
  `API_Contract.md`, the mapping lives in that feature's `api.ts` and nowhere
  else, with a comment saying what is missing.
- **Query keys live in `lib/query-keys.ts`** so invalidation is auditable.

## 3. Security and privacy

- Refresh token: httpOnly cookie only, never localStorage or a JSON body to JS.
- Access token: in memory (`lib/token.ts`), never persisted.
- All API calls use `credentials: "include"`.
- **Team content belongs to the team.** Boards, chat, documents and files are
  readable by team members only. Being an organisation admin or a platform
  operator grants administration rights, never read access to team content
  (SRS 3.5.4.2, 3.1.8.2). Enforced in `src/mocks/guard.ts` on the server side and
  by `TeamMembersOnly` / `OrgGate` in the UI.
- `lib/rbac.ts` holds every permission rule, one line per SRS clause it enforces.
- **File bytes are sealed in the browser.** `lib/crypto.ts` owns the AES-256-GCM
  envelope and is the only place that calls `crypto.subtle`; `lib/keystore.ts`
  owns the key, which is the one secret kept in `localStorage`. Uploads encrypt
  and downloads decrypt in `features/files/api.ts` — never bypass it with a raw
  `fetch`. The key is a fixed development key today (PLAN.md §8.10), so no
  screen claims end-to-end encryption.

## 4. File length & quality rules

- **Max 200 lines per file.** The one documented exception is `lib/types.ts`, the
  typed mirror of `API_Contract.md`: it declares no behaviour, and keeping the
  contract in a single readable file is worth more than the split.
- **One primary export per file.**
- **No `any`.** Prefer narrowing over casting.
- Comments explain *why*, never restate the line below.

## 5. Styling

- Light theme only. Every colour comes from a token in `globals.css` — no literal
  colours in feature code.
- Borders, not shadows. `shadow-*` is for overlays only (dialog, popover, menu).
- `tabular-nums` on anything that lines up in a column; `.data-mono` for IDs,
  codes, sizes and timestamps.
- Status is a dot plus a word or a 2px left rule, never a filled pill.
- Motion is 120ms opacity/transform, and `prefers-reduced-motion` is honoured.
- Reuse `.select-field`, `.label-eyebrow` and `.data-mono` rather than repeating
  the utility strings.

## 6. Best practices

- Keep pages slim; UI belongs in `features/*/components`.
- Default to Server Components; add `"use client"` only for real client state.
- Use the `@/` path alias (maps to `src/`).
- Add shadcn primitives with the CLI, never by hand.
