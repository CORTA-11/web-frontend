# Agent Rules & Guidelines

This document outlines the design patterns, code quality, and development guidelines for this repository. All agent code changes must conform to these rules.

## 1. Directory Structure (Component-Wise & Reusable)

Organize code cleanly and keep page routers slim. Business logic and UI elements should be divided into reusable pieces.

```text
web-frontend/
├── app/                  # Next.js pages & layouts
│   ├── layout.tsx        # Global App layout (Sidebar/Navigation integration)
│   ├── page.tsx          # Dashboard page (uses modular components)
│   └── sample/           # Sample page (empty template)
│       └── page.tsx
├── components/           # Reusable UI & domain-specific components
│   ├── ui/               # Atomic components (Card, Button, Input, etc.)
│   ├── layout/           # Layout blocks (Sidebar, Header, Footer)
│   └── dashboard/        # Dashboard-specific child components
├── hooks/                # Custom React hooks
├── lib/                  # Shared utility functions, API clients, helpers
└── types/                # TypeScript type definitions and interfaces
```

## 2. File Length & Quality Rules

- **Max 200 Lines**: No file should exceed **200 lines of code** (including comments and imports). If a component or helper grows larger, decompose it into smaller, decoupled sub-components or utility functions.
- **Component Isolation**: Each file should export a single primary component or function. Prefer named exports for utilities and components (except for Next.js routing pages/layouts, which must use default exports).
- **TypeScript Strictness**: Always define proper types or interfaces. Avoid `any` whenever possible.

## 3. Design System & Aesthetics (Tailwind CSS v4)

- **Premium UI**: Build high-quality, modern interfaces. Use rich gradients, subtle micro-animations (transitions), glassmorphism, and a cohesive color palette.
- **Responsive-first**: Design layouts to be fully adaptive (mobile-friendly using grid/flexbox and media utilities).
- **Theme Support**: Design with dark mode support in mind using tailwind colors (e.g., `bg-white dark:bg-zinc-950`).

## 4. Best Practices & Habits

- **Keep Components Pure**: Separate client actions (`"use client"`) from server rendering. Default to Server Components unless client state/interactivity is required.
- **Imports**: Use path aliases (e.g. `@/components/...` if configured in tsconfig, or clean relative paths).
- **Self-Documentation**: Write self-explanatory code. Comments should focus on *why* something is done, not *what* the code does.
