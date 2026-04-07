# work-qol

A collection of work quality-of-life tools for SaaS development teams. Hosted on Cloudflare Pages, secured via Cloudflare Access (Zero Trust).

## Tools

| Tool | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Live status widgets — PagerDuty incidents, on-call, Sentry errors, GitHub PRs |
| Scrum Poker | `/scrum-poker` | Real-time collaborative planning poker (PartyKit) |
| Standup Wheel | `/standup-wheel` | Spin to pick who runs standup today |
| Food Picker | `/food-picker` | Map of visited spots + randomizer |
| PagerDuty | `/pagerduty` | On-call schedule and active incidents |
| Sentry | `/sentry` | Unresolved error issues viewer |

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Routing**: React Router v6
- **Real-time**: [PartyKit](https://partykit.dev) (Scrum Poker)
- **API proxies**: Cloudflare Pages Functions
- **Storage**: Cloudflare KV (Food Picker places)
- **Auth**: Cloudflare Access (Zero Trust)
- **CI**: GitHub Actions

## Local Development

### Option A — Docker (recommended, no local Node required)

```bash
cp .env.example .env.local        # set VITE_PARTYKIT_HOST if needed
cp .dev.vars.example .dev.vars    # fill in API keys
docker compose up
```

App: http://localhost:5173 | PartyKit: http://localhost:1999

### Option B — Node directly

```bash
node -v  # requires Node 20+
npm install
cp .env.example .env.local
cp .dev.vars.example .dev.vars    # fill in API keys

npm run dev          # Vite dev server on :5173
npm run party:dev    # PartyKit server on :1999 (separate terminal)
```

To test Cloudflare Pages Functions locally (PagerDuty, Sentry, GitHub, Places):

```bash
npm run pages:dev    # builds then runs wrangler pages dev on :8788
```

## Environment Variables

### Frontend (Vite build-time, `.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_PARTYKIT_HOST` | PartyKit server host. `localhost:1999` for dev, `<project>.<user>.partykit.dev` for prod |

### Server-side (Cloudflare Pages Functions, `.dev.vars`)

| Variable | Description |
|----------|-------------|
| `PAGERDUTY_API_KEY` | PagerDuty REST API v2 token |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |
| `SENTRY_ORG_SLUG` | Sentry organization slug |
| `SENTRY_PROJECT_SLUG` | Sentry project slug |
| `GITHUB_TOKEN` | GitHub fine-grained PAT (read-only: Pull Requests) |
| `GITHUB_REPOS` | Comma-separated repos to track, e.g. `myorg/api,myorg/frontend` |

## Deployment

### 1. Deploy PartyKit (Scrum Poker backend)

```bash
npm run party:deploy
```

Note the deployed host URL and set `VITE_PARTYKIT_HOST` in `.env.production`.

### 2. Deploy to Cloudflare Pages

Connect this repo in the Cloudflare dashboard:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Environment variables**: add all server-side vars from the table above

### 3. Create KV Namespace (Food Picker)

In the Cloudflare dashboard, create a KV namespace named `PLACES`. Add its IDs to `wrangler.toml` and bind it to the Pages project.

### 4. Enable Cloudflare Access

In Zero Trust → Access → Applications, add your Cloudflare Pages app and configure an email allowlist or OAuth policy.

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run typecheck    # TypeScript check (no emit)
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run coverage     # Vitest with coverage report
npm run party:dev    # PartyKit local server
npm run party:deploy # Deploy PartyKit
npm run pages:dev    # Build + run wrangler pages dev (tests CF Functions locally)
```

## Project Structure

```
src/
├── pages/          # One file per route
├── components/     # Shared UI (Layout, ErrorBoundary, SkeletonCard, Toast)
├── hooks/          # useDarkMode, useAutoRefresh
├── utils/          # Pure functions (random, dates)
├── party/          # PartyKit server (deployed separately)
└── types/          # Shared TypeScript types

functions/
└── api/            # Cloudflare Pages Functions
    ├── pagerduty/  # oncall.ts, incidents.ts
    ├── sentry/     # issues.ts
    ├── github/     # prs.ts
    └── places/     # index.ts (KV-backed)
```
