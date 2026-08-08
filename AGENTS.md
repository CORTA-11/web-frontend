# Agent Rules & Guidelines

This document outlines the design patterns, code quality, and development guidelines for this repository. All agent code changes must conform to these rules.

## 1. Directory Structure

```text
web-frontend/
├── src/
│   ├── app/                 # Next.js App Router (plain paths, no () groups)
│   │   ├── login/
│   │   ├── register/
│   │   └── orgs/[orgId]/   # authenticated org shell
│   ├── components/
│   │   ├── ui/              # shadcn primitives
│   │   ├── layout/          # Sidebar, Header, ProfileMenu
│   │   └── auth/            # forms + guards
│   ├── lib/
│   │   ├── api/             # fetch client + auth API
│   │   ├── types/
│   │   └── mock/
│   ├── stores/              # zustand (no token localStorage)
│   └── hooks/
├── public/
└── next.config.ts           # /api → core-api proxy
```

## 2. Security

- Refresh token: httpOnly cookie only (never localStorage / JSON body to JS).
- Access token: in-memory only.
- Use `credentials: "include"` for API calls.

## 3. File Length & Quality Rules

- **Max 200 Lines**: No file should exceed **200 lines of code** (including comments and imports). If a component or helper grows larger, decompose it.
- **Component Isolation**: Each file should export a single primary component or function.
- **TypeScript Strictness**: Avoid `any` whenever possible.

## 4. Best Practices

- Keep page routers slim; put UI in `components/`.
- Default to Server Components unless client state is required.
- Use `@/` path alias (maps to `src/`).
