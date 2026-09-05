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
NEXT_PUBLIC_LIVE_MODULES=auth,teams,board,chat,files,resources
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8081
```

Anything not listed stays mocked. `all` switches everything over. Chat live
mode uses core-api for history/send/delete and fetches a short-lived socket
ticket before connecting to socket-server at `NEXT_PUBLIC_WS_BASE_URL`.

For Docker, start the backend stack first, then run:

```bash
docker compose up --build -d web
```

## Tests

```bash
npx playwright install chromium   # first run only
npx playwright test
```

31 specs covering sign-in, teams and membership rules, the Kanban board
(including keyboard drag), chat, resource approval, documents, file upload and
the encrypt/decrypt round trip, the platform console, and the privacy boundaries
between the three tiers.

## File encryption

File contents are encrypted in the browser with AES-256-GCM before upload and
decrypted after download (`lib/crypto.ts`), so the server stores ciphertext and
sees `application/vnd.corta.encrypted` as the content type. The key is held in
the browser (`localStorage`, key `corta.file-key`) by `lib/keystore.ts`.

It is a **fixed development key**, the same in every browser: key generation,
exchange and rotation are still open (`PLAN.md` §8.10). Clearing the key from
storage restores the same fixed key, so nothing becomes unreadable — but that
also means this is not yet end-to-end encryption. Files uploaded before this
existed, and any written by another client in the clear, still download fine:
the envelope is detected, not assumed.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
