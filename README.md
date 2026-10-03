# Synodus web frontend

Next.js application for organizations, teams, tasks, chat, documents, and files.
For the complete local stack, use the
[infra installer](https://github.com/CORTA-11/infra#local-setup).

## Source development

Use Node.js 22+ and start the backend and realtime services first:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. The example configuration uses core-api at
`localhost:8080` and WebSockets through Envoy at `localhost:10000`.
`docker-compose.yaml` provides the source-build workflow on `synodus-network`.

## Live API and mocks

`NEXT_PUBLIC_LIVE_MODULES` selects which modules call core-api. The example
configuration enables auth, teams, AI, board, chat, files, resources, and
documents; unlisted modules remain mocked. Set it to `all` for all live modules,
or clear it for mock development. `NEXT_PUBLIC_MOCKS=on` forces mocks.

`API_PROXY_TARGET` sets the backend behind the `/api` proxy. Browser WebSockets
use the page origin when `NEXT_PUBLIC_WS_BASE_URL` is unset; the example points
them at local Envoy. `NEXT_PUBLIC_*` values are embedded at build time.

Mock accounts use password `synodus-demo-password`:

| Account | Role |
| --- | --- |
| `platform@corta.dev` | Platform operator |
| `admin@aratuwa.edu` | Organization admin |
| `leader@aratuwa.edu` | Team leader |
| `member@aratuwa.edu` | Team member |

These accounts belong to mock mode; register an account for a fresh live stack.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run test:unit
npx playwright install chromium   # once
npx playwright test              # mock browser tests
npm run test:live                # running API and realtime stack required
npm run build
```

## Content security

File contents are encrypted in the browser with AES-256-GCM. Account RSA keys
are stored sealed on the server; the device keeps an unsealed private key per
account in localStorage. Team keys rotate with membership changes. Opening
documents or downloading files requires current team membership and a creator
grant; organization administration alone does not grant access to team content.

Feature code lives in `src/features`, shared helpers in `src/lib`, and routes in
`src/app`. The HTTP contract is maintained in
[core-api OpenAPI](https://github.com/CORTA-11/core-api/blob/main/api/openapi.yaml).
