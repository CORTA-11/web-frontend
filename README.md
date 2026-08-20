# CORTA — web frontend

Next.js app for the privacy-preserving collaborative resource and task
orchestrator. See `PLAN.md` for the build plan and `API_Contract.md` for the wire
format.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

Out of the box the app runs entirely against an in-browser mock server (MSW), so
no backend is needed to click through every screen.

### Accounts

All passwords are `password123`.

| Account | Role |
|---|---|
| `platform@corta.dev` | Platform operator — approves and suspends organisations |
| `admin@aratuwa.edu` | Organisation admin — teams, resources, people, settings |
| `leader@aratuwa.edu` | Team leader of Neural Imaging |
| `member@aratuwa.edu` | Team member in three teams |

Organisation join ID for registration: `aratuwa`.

## Going live, module by module

`NEXT_PUBLIC_LIVE_MODULES` decides which modules skip the mock server and hit
core-api through the `/api` proxy:

```env
NEXT_PUBLIC_LIVE_MODULES=auth,teams,board,files
```

Anything not listed stays mocked. `all` switches everything over. What core-api
actually implements today — and what it still owes the frontend — is listed in
`PLAN.md` §10.

## Tests

```bash
npx playwright install chromium   # first run only
npx playwright test
```

29 specs covering sign-in, teams and membership rules, the Kanban board
(including keyboard drag), chat, resource approval, documents, file upload, the
platform console, and the privacy boundaries between the three tiers.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
