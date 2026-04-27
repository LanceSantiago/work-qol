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
| GitHub PRs | `/github` | Open pull requests across all configured repos |

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
| `ABSENCE_ICS_URL` | Private ICS/iCal feed URL for absence tracking |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |
| `SENTRY_ORG_SLUG` | Sentry organization slug |
| `SENTRY_PROJECT_SLUG` | Sentry project slug |
| `GITHUB_TOKEN` | GitHub fine-grained PAT (read-only: Pull Requests) |
| `GITHUB_REPOS` | Comma-separated repos to track, e.g. `myorg/api,myorg/frontend` |

## Cloudflare Pages Setup

### Required environment variables

Add these as **secrets** in the Cloudflare Pages dashboard under **Settings → Environment variables**. They are server-side only and never sent to the browser.

| Variable | Where to get it | What it does / what data it pulls |
|----------|----------------|-----------------------------------|
| `PAGERDUTY_API_KEY` | PagerDuty → **Integrations → API Access Keys** → Create key (read-only) | Authenticates against the PagerDuty REST API v2. Pulls the current on-call schedule (who is on-call per escalation policy) and any active/triggered incidents. |
| `ABSENCE_ICS_URL` | Your absence/leave management tool (e.g. HR system, Google Calendar, Personio) — copy the private ICS/iCal feed URL | Fetches an `.ics` calendar feed and parses it to show who is absent today. The URL typically contains a secret token — treat it like a password. |
| `SENTRY_AUTH_TOKEN` | Sentry → **Settings → Account → API → Auth Tokens** → Create token (scope: `org:read`, `project:read`, `event:read`) | Authenticates against the Sentry API. Pulls the 50 most recent unresolved issues across the org from the last 24 hours, including error counts and affected user counts. |
| `SENTRY_ORG_SLUG` | Sentry → **Settings → Organization** → the slug shown in the URL (e.g. `my-company`) | Identifies which Sentry organization to query. |
| `SENTRY_PROJECT_SLUG` | Sentry → **Settings → Projects** → project slug | _(Currently reserved for future per-project filtering; not yet used in API calls.)_ |
| `GITHUB_TOKEN` | GitHub → **Settings → Developer settings → Fine-grained personal access tokens** → New token. Grant **read-only** access to **Pull requests** for the target repos. | Authenticates against the GitHub REST API. Pulls open (non-draft) pull requests from every repo listed in `GITHUB_REPOS`, flagging any PRs older than 2 days as stale. |
| `GITHUB_REPOS` | Not a secret — set as a plain variable | Comma-separated list of `org/repo` slugs to monitor, e.g. `myorg/api,myorg/frontend`. Controls which repos the PR widget queries. |

### KV namespaces

Three KV namespaces are required and must be bound in the Pages dashboard under **Settings → Functions → KV namespace bindings**:

| Binding name | Purpose |
|---|---|
| `PLACES` | Stores Food Picker locations (name, coordinates, visited flag). |
| `STANDUP` | Stores the standup wheel participant list and last winner. |
| `CLAUDE_STATS` | Stores Claude API token usage stats. |

Create each namespace via the Cloudflare dashboard or:
```bash
wrangler kv namespace create work-qol-places
wrangler kv namespace create work-qol-standup
wrangler kv namespace create claude-stats
```

Then copy the returned IDs into [wrangler.toml](wrangler.toml) and bind them in the Pages dashboard using the binding names above.

---

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

1. Go to [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → **Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → choose **Self-hosted**
3. Set **Application name** (e.g. `work-qol`) and **Application domain** to your Cloudflare Pages URL (e.g. `work-qol.pages.dev`)
4. Under **Policies**, create a policy (e.g. `Allow team`) with a rule like:
   - **Selector**: Emails → add allowed email addresses, **or**
   - **Selector**: Emails ending in → your company domain (e.g. `@yourcompany.com`)
5. Save the application — Cloudflare will now gate the entire site behind a login page

No code changes are needed; Cloudflare handles the auth entirely at the edge.

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
