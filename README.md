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

## Deployment

### Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
- A [PartyKit account](https://www.partykit.dev) (for Scrum Poker)
- Node 20+ and `npm` installed locally
- Wrangler CLI: `npm install -g wrangler` then `wrangler login`

---

### Step 1 — Gather your API credentials

Collect these before you start. Each one is added to Cloudflare Pages as a secret in a later step.

| Variable | Where to get it | What it's used for |
|----------|----------------|-------------------|
| `PAGERDUTY_API_KEY` | PagerDuty → **Integrations → API Access Keys** → Create key (read-only) | Fetches the current on-call schedule and active/triggered incidents via the PagerDuty REST API v2. |
| `ABSENCE_ICS_URL` | Your HR/leave tool (e.g. Google Calendar, Personio) — copy the private ICS/iCal feed URL | Fetches an `.ics` calendar feed to show who is absent today. The URL usually contains a secret — treat it like a password. |
| `SENTRY_AUTH_TOKEN` | Sentry → **Settings → Account → API → Auth Tokens** → Create token with scopes: `org:read`, `project:read`, `event:read` | Fetches the 50 most recent unresolved issues from the last 24 hours across your Sentry org. |
| `SENTRY_ORG_SLUG` | Sentry → **Settings → Organization** — the slug in the URL (e.g. `my-company`) | Tells the Sentry API which organization to query. |
| `SENTRY_PROJECT_SLUG` | Sentry → **Settings → Projects** — the project slug | Reserved for future per-project filtering (not currently queried). |
| `GITHUB_TOKEN` | GitHub → **Settings → Developer settings → Fine-grained personal access tokens** → New token. Grant **read-only** access to **Pull requests** on the target repos. | Fetches open PRs across all repos in `GITHUB_REPOS`, flagging any older than 2 days as stale. |
| `GITHUB_REPOS` | Not a secret — enter as a plain variable | Comma-separated `org/repo` slugs to monitor, e.g. `myorg/api,myorg/frontend`. |

---

### Step 2 — Deploy the PartyKit server (Scrum Poker backend)

PartyKit is deployed separately from Cloudflare Pages and must be done first so you have the host URL for the build step.

```bash
npm install
npm run party:deploy
```

Note the host URL printed at the end — it looks like `work-qol.<your-username>.partykit.dev`.

---

### Step 3 — Create KV namespaces

Three KV namespaces are required for persistent storage. Run these commands and note the IDs printed after each one:

```bash
wrangler kv namespace create dash-places
wrangler kv namespace create dash-standup
```

Open [wrangler.toml](wrangler.toml) and replace the `id` and `preview_id` values under each `[[kv_namespaces]]` block with the IDs returned above:

| Binding | Namespace name | Purpose |
|---------|---------------|---------|
| `PLACES` | `dash-places` | Food Picker locations (name, coordinates, visited flag) |
| `STANDUP` | `dash-standup` | Standup wheel participant list and last winner |
| `CLAUDE_STATS` | `claude-stats` | Claude API token usage stats |

Commit and push the updated `wrangler.toml` to your repo before continuing.

---

### Step 4 — Connect the repo to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Authorize Cloudflare to access your GitHub/GitLab account and select this repo
3. On the **Build settings** screen, set:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy** — the first deploy will fail because env vars aren't set yet. That's fine.

---

### Step 5 — Add environment variables

1. In the Pages project, go to **Settings → Environment variables**
2. Add the following for the **Production** environment. Use **Encrypt** (secret) for all tokens and URLs; use plain text for slugs and `GITHUB_REPOS`.

   | Variable | Type |
   |----------|------|
   | `PAGERDUTY_API_KEY` | Secret |
   | `ABSENCE_ICS_URL` | Secret |
   | `SENTRY_AUTH_TOKEN` | Secret |
   | `SENTRY_ORG_SLUG` | Plain text |
   | `SENTRY_PROJECT_SLUG` | Plain text |
   | `GITHUB_TOKEN` | Secret |
   | `GITHUB_REPOS` | Plain text |
   | `VITE_PARTYKIT_HOST` | Plain text — set to the PartyKit host from Step 2 |

3. Click **Save**

---

### Step 6 — Bind KV namespaces to the Pages project

1. In the Pages project, go to **Settings → Functions → KV namespace bindings**
2. Add three bindings using the namespaces created in Step 3:

   | Variable name | KV namespace |
   |--------------|-------------|
   | `PLACES` | `dash-places` |
   | `STANDUP` | `dash-standup` |
   | `CLAUDE_STATS` | `claude-stats` |

3. Click **Save**

---

### Step 7 — Trigger a production deploy

Go to **Deployments** and click **Retry deployment** on the failed deploy from Step 4, or push any commit to trigger a new build. The site should deploy successfully and be available at `https://work-qol.pages.dev` (or your custom domain).

---

### Step 8 — Lock down with Cloudflare Access (Zero Trust)

Without this step the site is publicly accessible to anyone with the URL.

1. Go to [one.dash.cloudflare.com](https://one.dash.cloudflare.com) → **Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Set:
   - **Application name**: `work-qol`
   - **Application domain**: your Pages URL (e.g. `work-qol.pages.dev`)
4. Under **Policies**, click **Add a policy** (e.g. `Allow team`) and add a rule:
   - **Selector: Emails ending in** → your company domain (e.g. `@yourcompany.com`), **or**
   - **Selector: Emails** → list specific addresses
5. Save — Cloudflare will now require a one-time email code before anyone can reach the site. No code changes needed.

---

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
